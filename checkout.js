/* ============================================================
   Pure-JS QR Code generator (byte mode)
   Port of kazuhikoarase/qrcode-generator core (MIT License)
   Exposes: QRCodeLocal.make(text, ecLevel) -> { size, modules[][] }
   No external dependency, works fully offline.
============================================================ */
(function (root) {

  // ---- error correction levels ----
  var QRErrorCorrectLevel = { L: 1, M: 0, Q: 3, H: 2 };

  // ---- mode ----
  var MODE_8BIT_BYTE = 1 << 2;

  // ---------- math (GF(256)) ----------
  var QRMath = (function () {
    var EXP = new Array(256);
    var LOG = new Array(256);
    for (var i = 0; i < 8; i++) EXP[i] = 1 << i;
    for (i = 8; i < 256; i++) EXP[i] = EXP[i-4] ^ EXP[i-5] ^ EXP[i-6] ^ EXP[i-8];
    for (i = 0; i < 255; i++) LOG[EXP[i]] = i;
    return {
      glog: function (n) { if (n < 1) throw new Error("glog(" + n + ")"); return LOG[n]; },
      gexp: function (n) { while (n < 0) n += 255; while (n >= 256) n -= 255; return EXP[n]; }
    };
  })();

  // ---------- polynomial ----------
  function QRPolynomial(num, shift) {
    var offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (var i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
  }
  QRPolynomial.prototype = {
    get: function (i) { return this.num[i]; },
    getLength: function () { return this.num.length; },
    multiply: function (e) {
      var num = new Array(this.getLength() + e.getLength() - 1);
      for (var i = 0; i < this.getLength(); i++)
        for (var j = 0; j < e.getLength(); j++)
          num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
      return new QRPolynomial(num, 0);
    },
    mod: function (e) {
      if (this.getLength() - e.getLength() < 0) return this;
      var ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
      var num = new Array(this.getLength());
      for (var i = 0; i < this.getLength(); i++) num[i] = this.get(i);
      for (i = 0; i < e.getLength(); i++) num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
      return new QRPolynomial(num, 0).mod(e);
    }
  };

  // ---------- RS block table (versions 1-40, levels [L,M,Q,H] order in spec rows) ----------
  var RS_BLOCK_TABLE = [
    [1,26,19],[1,26,16],[1,26,13],[1,26,9],
    [1,44,34],[1,44,28],[1,44,22],[1,44,16],
    [1,70,55],[1,70,44],[2,35,17],[2,35,13],
    [1,100,80],[2,50,32],[2,50,24],[4,25,9],
    [1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],
    [2,86,68],[4,43,27],[4,43,19],[4,43,15],
    [2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],
    [2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],
    [2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],
    [2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],
    [4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],
    [2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],
    [4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],
    [3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],
    [5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12,7,37,13],
    [5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],
    [1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],
    [5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],
    [3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],
    [3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],
    [4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],
    [2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],
    [4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],
    [6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],
    [8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],
    [10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],
    [8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],
    [3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],
    [7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],
    [5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],
    [13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],
    [17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],
    [17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],
    [13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],
    [12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],
    [6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],
    [17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],
    [4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],
    [20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],
    [19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]
  ];

  function QRRSBlock(totalCount, dataCount) { this.totalCount = totalCount; this.dataCount = dataCount; }
  QRRSBlock.getRSBlocks = function (typeNumber, ecLevel) {
    var rsIndexMap = { 1:1, 0:0, 3:2, 2:3 }; // L,M,Q,H -> column order in table rows
    // table rows are grouped per version as 4 entries: [L, M, Q, H]
    var idx = (typeNumber - 1) * 4 + rsIndexMap[ecLevel];
    var d = RS_BLOCK_TABLE[idx];
    if (!d) throw new Error("bad rs block @ ver " + typeNumber + " ec " + ecLevel);
    var list = [];
    var len = d.length / 3;
    for (var i = 0; i < len; i++) {
      var count = d[i*3 + 0], total = d[i*3 + 1], data = d[i*3 + 2];
      for (var j = 0; j < count; j++) list.push(new QRRSBlock(total, data));
    }
    return list;
  };

  // ---------- bit buffer ----------
  function QRBitBuffer() { this.buffer = []; this.length = 0; }
  QRBitBuffer.prototype = {
    get: function (index) { return ((this.buffer[Math.floor(index/8)] >>> (7 - index%8)) & 1) === 1; },
    put: function (num, length) { for (var i = 0; i < length; i++) this.putBit(((num >>> (length-i-1)) & 1) === 1); },
    getLengthInBits: function () { return this.length; },
    putBit: function (bit) {
      var bufIndex = Math.floor(this.length / 8);
      if (this.buffer.length <= bufIndex) this.buffer.push(0);
      if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
      this.length++;
    }
  };

  // ---------- 8bit byte data (UTF-8) ----------
  function QR8bitByte(data) {
    this.mode = MODE_8BIT_BYTE;
    this.bytes = toUTF8Bytes(data);
  }
  QR8bitByte.prototype = {
    getLength: function () { return this.bytes.length; },
    write: function (buffer) { for (var i = 0; i < this.bytes.length; i++) buffer.put(this.bytes[i], 8); }
  };
  function toUTF8Bytes(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) { out.push(0xC0 | (c >> 6)); out.push(0x80 | (c & 0x3F)); }
      else if (c < 0xD800 || c >= 0xE000) { out.push(0xE0 | (c >> 12)); out.push(0x80 | ((c >> 6) & 0x3F)); out.push(0x80 | (c & 0x3F)); }
      else { // surrogate pair
        i++; var c2 = str.charCodeAt(i);
        var cp = 0x10000 + (((c & 0x3FF) << 10) | (c2 & 0x3FF));
        out.push(0xF0 | (cp >> 18)); out.push(0x80 | ((cp >> 12) & 0x3F));
        out.push(0x80 | ((cp >> 6) & 0x3F)); out.push(0x80 | (cp & 0x3F));
      }
    }
    return out;
  }

  // ---------- utilities ----------
  var QRUtil = {
    PATTERN_POSITION_TABLE: [
      [],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],
      [6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],
      [6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],
      [6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],
      [6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],
      [6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],
      [6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]
    ],
    G15: (1<<10)|(1<<8)|(1<<5)|(1<<4)|(1<<2)|(1<<1)|(1<<0),
    G18: (1<<12)|(1<<11)|(1<<10)|(1<<9)|(1<<8)|(1<<5)|(1<<2)|(1<<0),
    G15_MASK: (1<<14)|(1<<12)|(1<<10)|(1<<4)|(1<<1),
    getBCHTypeInfo: function (data) {
      var d = data << 10;
      while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0)
        d ^= (QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15)));
      return ((data << 10) | d) ^ QRUtil.G15_MASK;
    },
    getBCHTypeNumber: function (data) {
      var d = data << 12;
      while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0)
        d ^= (QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18)));
      return (data << 12) | d;
    },
    getBCHDigit: function (data) { var digit = 0; while (data !== 0) { digit++; data >>>= 1; } return digit; },
    getPatternPosition: function (typeNumber) { return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1]; },
    getMask: function (maskPattern, i, j) {
      switch (maskPattern) {
        case 0: return (i + j) % 2 === 0;
        case 1: return i % 2 === 0;
        case 2: return j % 3 === 0;
        case 3: return (i + j) % 3 === 0;
        case 4: return (Math.floor(i/2) + Math.floor(j/3)) % 2 === 0;
        case 5: return (i*j)%2 + (i*j)%3 === 0;
        case 6: return ((i*j)%2 + (i*j)%3) % 2 === 0;
        case 7: return ((i*j)%3 + (i+j)%2) % 2 === 0;
        default: throw new Error("bad maskPattern:" + maskPattern);
      }
    },
    getErrorCorrectPolynomial: function (errorCorrectLength) {
      var a = new QRPolynomial([1], 0);
      for (var i = 0; i < errorCorrectLength; i++) a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
      return a;
    },
    getLengthInBits: function (mode, type) {
      if (1 <= type && type < 10) return 8;        // byte mode CCI
      else if (type < 27) return 16;
      else if (type < 41) return 16;
      else throw new Error("type:" + type);
    },
    getLostPoint: function (qrcode) {
      var moduleCount = qrcode.getModuleCount(), lostPoint = 0, row, col, dark, count, sameCount, r, c;
      for (row = 0; row < moduleCount; row++) for (col = 0; col < moduleCount; col++) {
        sameCount = 0; dark = qrcode.isDark(row, col);
        for (r = -1; r <= 1; r++) { if (row+r < 0 || moduleCount <= row+r) continue;
          for (c = -1; c <= 1; c++) { if (col+c < 0 || moduleCount <= col+c) continue;
            if (r===0 && c===0) continue;
            if (dark === qrcode.isDark(row+r, col+c)) sameCount++; } }
        if (sameCount > 5) lostPoint += (3 + sameCount - 5);
      }
      for (row = 0; row < moduleCount-1; row++) for (col = 0; col < moduleCount-1; col++) {
        count = 0;
        if (qrcode.isDark(row,col)) count++;
        if (qrcode.isDark(row+1,col)) count++;
        if (qrcode.isDark(row,col+1)) count++;
        if (qrcode.isDark(row+1,col+1)) count++;
        if (count===0 || count===4) lostPoint += 3;
      }
      for (row = 0; row < moduleCount; row++) for (col = 0; col < moduleCount-6; col++) {
        if (qrcode.isDark(row,col) && !qrcode.isDark(row,col+1) && qrcode.isDark(row,col+2) &&
            qrcode.isDark(row,col+3) && qrcode.isDark(row,col+4) && !qrcode.isDark(row,col+5) &&
            qrcode.isDark(row,col+6)) lostPoint += 40;
      }
      for (col = 0; col < moduleCount; col++) for (row = 0; row < moduleCount-6; row++) {
        if (qrcode.isDark(row,col) && !qrcode.isDark(row+1,col) && qrcode.isDark(row+2,col) &&
            qrcode.isDark(row+3,col) && qrcode.isDark(row+4,col) && !qrcode.isDark(row+5,col) &&
            qrcode.isDark(row+6,col)) lostPoint += 40;
      }
      var darkCount = 0;
      for (col = 0; col < moduleCount; col++) for (row = 0; row < moduleCount; row++)
        if (qrcode.isDark(row,col)) darkCount++;
      var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
      lostPoint += ratio * 10;
      return lostPoint;
    }
  };

  // ---------- create data / bytes ----------
  function createData(typeNumber, ecLevel, dataList) {
    var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, ecLevel);
    var buffer = new QRBitBuffer();
    for (var i = 0; i < dataList.length; i++) {
      var data = dataList[i];
      buffer.put(data.mode, 4);
      buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
      data.write(buffer);
    }
    var totalDataCount = 0;
    for (i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;
    if (buffer.getLengthInBits() > totalDataCount * 8)
      throw new Error("code length overflow. (" + buffer.getLengthInBits() + ">" + totalDataCount*8 + ")");
    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) buffer.put(0, 4);
    while (buffer.getLengthInBits() % 8 !== 0) buffer.putBit(false);
    while (true) {
      if (buffer.getLengthInBits() >= totalDataCount * 8) break;
      buffer.put(0xEC, 8);
      if (buffer.getLengthInBits() >= totalDataCount * 8) break;
      buffer.put(0x11, 8);
    }
    return createBytes(buffer, rsBlocks);
  }
  function createBytes(buffer, rsBlocks) {
    var offset = 0, maxDcCount = 0, maxEcCount = 0;
    var dcdata = new Array(rsBlocks.length), ecdata = new Array(rsBlocks.length);
    for (var r = 0; r < rsBlocks.length; r++) {
      var dcCount = rsBlocks[r].dataCount;
      var ecCount = rsBlocks[r].totalCount - dcCount;
      maxDcCount = Math.max(maxDcCount, dcCount);
      maxEcCount = Math.max(maxEcCount, ecCount);
      dcdata[r] = new Array(dcCount);
      for (var i = 0; i < dcdata[r].length; i++) dcdata[r][i] = 0xff & buffer.buffer[i + offset];
      offset += dcCount;
      var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
      var rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
      var modPoly = rawPoly.mod(rsPoly);
      ecdata[r] = new Array(rsPoly.getLength() - 1);
      for (i = 0; i < ecdata[r].length; i++) {
        var modIndex = i + modPoly.getLength() - ecdata[r].length;
        ecdata[r][i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0;
      }
    }
    var totalCodeCount = 0;
    for (i = 0; i < rsBlocks.length; i++) totalCodeCount += rsBlocks[i].totalCount;
    var data = new Array(totalCodeCount), index = 0;
    for (i = 0; i < maxDcCount; i++) for (r = 0; r < rsBlocks.length; r++) if (i < dcdata[r].length) data[index++] = dcdata[r][i];
    for (i = 0; i < maxEcCount; i++) for (r = 0; r < rsBlocks.length; r++) if (i < ecdata[r].length) data[index++] = ecdata[r][i];
    return data;
  }

  // ---------- QRCode model ----------
  function QRCodeModel(typeNumber, ecLevel) {
    this.typeNumber = typeNumber;
    this.errorCorrectLevel = ecLevel;
    this.modules = null;
    this.moduleCount = 0;
    this.dataCache = null;
    this.dataList = [];
  }
  QRCodeModel.prototype = {
    addData: function (data) { this.dataList.push(new QR8bitByte(data)); this.dataCache = null; },
    isDark: function (row, col) {
      if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) throw new Error(row + "," + col);
      return this.modules[row][col];
    },
    getModuleCount: function () { return this.moduleCount; },
    make: function () { this.makeImpl(false, this.getBestMaskPattern()); },
    makeImpl: function (test, maskPattern) {
      this.moduleCount = this.typeNumber * 4 + 17;
      this.modules = [];
      for (var row = 0; row < this.moduleCount; row++) { this.modules[row] = new Array(this.moduleCount); for (var col = 0; col < this.moduleCount; col++) this.modules[row][col] = null; }
      this.setupPositionProbePattern(0, 0);
      this.setupPositionProbePattern(this.moduleCount - 7, 0);
      this.setupPositionProbePattern(0, this.moduleCount - 7);
      this.setupPositionAdjustPattern();
      this.setupTimingPattern();
      this.setupTypeInfo(test, maskPattern);
      if (this.typeNumber >= 7) this.setupTypeNumber(test);
      if (this.dataCache === null) this.dataCache = createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
      this.mapData(this.dataCache, maskPattern);
    },
    setupPositionProbePattern: function (row, col) {
      for (var r = -1; r <= 7; r++) { if (row+r <= -1 || this.moduleCount <= row+r) continue;
        for (var c = -1; c <= 7; c++) { if (col+c <= -1 || this.moduleCount <= col+c) continue;
          this.modules[row+r][col+c] = (0<=r&&r<=6&&(c===0||c===6)) || (0<=c&&c<=6&&(r===0||r===6)) || (2<=r&&r<=4&&2<=c&&c<=4);
        } }
    },
    getBestMaskPattern: function () {
      var minLostPoint = 0, pattern = 0;
      for (var i = 0; i < 8; i++) {
        this.makeImpl(true, i);
        var lostPoint = QRUtil.getLostPoint(this);
        if (i === 0 || minLostPoint > lostPoint) { minLostPoint = lostPoint; pattern = i; }
      }
      return pattern;
    },
    setupTimingPattern: function () {
      for (var r = 8; r < this.moduleCount - 8; r++) { if (this.modules[r][6] !== null) continue; this.modules[r][6] = (r % 2 === 0); }
      for (var c = 8; c < this.moduleCount - 8; c++) { if (this.modules[6][c] !== null) continue; this.modules[6][c] = (c % 2 === 0); }
    },
    setupPositionAdjustPattern: function () {
      var pos = QRUtil.getPatternPosition(this.typeNumber);
      for (var i = 0; i < pos.length; i++) for (var j = 0; j < pos.length; j++) {
        var row = pos[i], col = pos[j];
        if (this.modules[row][col] !== null) continue;
        for (var r = -2; r <= 2; r++) for (var c = -2; c <= 2; c++)
          this.modules[row+r][col+c] = (r===-2||r===2||c===-2||c===2||(r===0&&c===0));
      }
    },
    setupTypeNumber: function (test) {
      var bits = QRUtil.getBCHTypeNumber(this.typeNumber);
      for (var i = 0; i < 18; i++) { var mod = (!test && ((bits >> i) & 1) === 1); this.modules[Math.floor(i/3)][i%3 + this.moduleCount - 8 - 3] = mod; }
      for (i = 0; i < 18; i++) { mod = (!test && ((bits >> i) & 1) === 1); this.modules[i%3 + this.moduleCount - 8 - 3][Math.floor(i/3)] = mod; }
    },
    setupTypeInfo: function (test, maskPattern) {
      var data = (this.errorCorrectLevel << 3) | maskPattern;
      var bits = QRUtil.getBCHTypeInfo(data), i, mod;
      for (i = 0; i < 15; i++) {
        mod = (!test && ((bits >> i) & 1) === 1);
        if (i < 6) this.modules[i][8] = mod;
        else if (i < 8) this.modules[i+1][8] = mod;
        else this.modules[this.moduleCount - 15 + i][8] = mod;
      }
      for (i = 0; i < 15; i++) {
        mod = (!test && ((bits >> i) & 1) === 1);
        if (i < 8) this.modules[8][this.moduleCount - i - 1] = mod;
        else if (i < 9) this.modules[8][15 - i - 1 + 1] = mod;
        else this.modules[8][15 - i - 1] = mod;
      }
      this.modules[this.moduleCount - 8][8] = (!test);
    },
    mapData: function (data, maskPattern) {
      var inc = -1, row = this.moduleCount - 1, bitIndex = 7, byteIndex = 0;
      for (var col = this.moduleCount - 1; col > 0; col -= 2) {
        if (col === 6) col--;
        while (true) {
          for (var c = 0; c < 2; c++) {
            if (this.modules[row][col - c] === null) {
              var dark = false;
              if (byteIndex < data.length) dark = (((data[byteIndex] >>> bitIndex) & 1) === 1);
              var mask = QRUtil.getMask(maskPattern, row, col - c);
              if (mask) dark = !dark;
              this.modules[row][col - c] = dark;
              bitIndex--;
              if (bitIndex === -1) { byteIndex++; bitIndex = 7; }
            }
          }
          row += inc;
          if (row < 0 || this.moduleCount <= row) { row -= inc; inc = -inc; break; }
        }
      }
    }
  };

  // ---------- public API ----------
  function make(text, ecName) {
    var ec = QRErrorCorrectLevel[ecName || "M"];
    // find smallest version that fits
    for (var type = 1; type <= 40; type++) {
      try {
        var qr = new QRCodeModel(type, ec);
        qr.addData(text);
        qr.make();
        var size = qr.getModuleCount();
        var modules = [];
        for (var r = 0; r < size; r++) { modules[r] = []; for (var c = 0; c < size; c++) modules[r][c] = qr.isDark(r, c); }
        return { size: size, version: type, modules: modules };
      } catch (e) {
        if (("" + e).indexOf("overflow") === -1 && ("" + e).indexOf("code length") === -1) throw e;
        // else: too small, try next version
      }
    }
    throw new Error("data too long for QR");
  }

  root.QRCodeLocal = { make: make };

})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));

if (typeof module !== "undefined" && module.exports) module.exports = (typeof globalThis !== "undefined" ? globalThis : this).QRCodeLocal;
/* ==========================================
   GLOBAL STATE
========================================== */

let cart = [];

const CONFIG = {
    provinceApi:
    "https://script.google.com/macros/s/AKfycbwHU1aqw9TATKgHVNcTFSBomSWAdzortx8dgaKAdjfQstl30yb34jtziUk-XTjcHi134g/exec",

    lineApi:
    "https://line-api-backend.onrender.com/push",

    sheetApi:
    "https://sheet-backend-lsg9.onrender.com/save-order",

    /* ★★★ ตั้งค่าหมายเลข PromptPay ของร้านตรงนี้ ★★★
       รองรับ: เบอร์มือถือ (เช่น 0812345678),
               เลขบัตรประชาชน / Tax ID (13 หลัก),
               เลข e-Wallet (15 หลัก)
       QR จะถูกสร้างฝั่งหน้าเว็บทันที ไม่ต้องรอ API ภายนอก */
    promptPayId: "0654982592"
};

/* ==========================================
   UTILITIES
========================================== */

function formatMoney(number) {

    return Number(number)
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

}

function showLoading() {

    $("#waiting").css("display", "flex");

}

function hideLoading() {

    $("#waiting").css("display", "none");

}

function generateOrderNumber() {

    const orderNumber =
        Math.floor(
            10000000 +
            Math.random() * 90000000
        );

    $("#ordernumber").text(orderNumber);

}

/* ==========================================
   LOAD PROVINCE
========================================== */

async function loadProvince() {

    try {

        const response =
            await fetch(CONFIG.provinceApi);

        const provinces =
            await response.json();

        const select =
            document.getElementById("province");

        select.innerHTML =
            `<option value="" selected disabled>
                เลือกจังหวัด
             </option>`;

        provinces.forEach(item => {

            const option =
                document.createElement("option");

            option.value = item;
            option.textContent = item;

            select.appendChild(option);

        });

    }
    catch (error) {

        console.error(error);

        $("#province").html(
            `<option value="">
                โหลดข้อมูลไม่สำเร็จ
             </option>`
        );

    }

}

/* ==========================================
   LOAD CART
========================================== */

function loadCart() {

    const savedCart =
        localStorage.getItem("cart");

    if (!savedCart) {

        cart = [];
        renderSummaryCart();

        return;
    }

    cart = JSON.parse(savedCart);

    renderSummaryCart();
    renderReceiptTable();
    updateReceiptTotal();

}

/* ==========================================
   SUMMARY CART
========================================== */

function renderSummaryCart() {

    const container =
        document.getElementById("summaryCart");

    if (!cart.length) {

        container.innerHTML = `
            <li class="list-group-item text-center">
                ไม่มีสินค้าในตะกร้า
            </li>
        `;

        $("#amount").text("0.00");

        return;
    }

    let html = "";
    let total = 0;

    cart.forEach(item => {

        const itemTotal =
            item.price * item.count;

        total += itemTotal;

        html += `
        <li class="list-group-item">

            <div class="d-flex justify-content-between">

                <div>

                    <div class="fw-semibold">
                        ${item.name}
                    </div>

                    <small class="text-muted">
                        ${formatMoney(item.price)}
                        ×
                        ${item.count}
                    </small>

                </div>

                <div class="fw-bold">

                    ${formatMoney(itemTotal)}

                </div>

            </div>

        </li>
        `;

    });

    container.innerHTML = html;

    $("#amount").text(
        formatMoney(total)
    );

    $("#total1").text(
        formatMoney(total)
    );

}

/* ==========================================
   RECEIPT TABLE
========================================== */

function renderReceiptTable() {

    const tbody =
        document.getElementById("bodyrecieve");

    if (!cart.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="3"
                class="text-center">

                ไม่มีสินค้า

                </td>
            </tr>
        `;

        return;
    }

    let html = "";

    cart.forEach(item => {

        const total =
            item.price * item.count;

        html += `
        <tr>

            <td>
                ${item.name}
            </td>

            <td class="text-center">
                ${item.count}
            </td>

            <td class="text-end">
                ${formatMoney(total)}
            </td>

        </tr>
        `;

    });

    tbody.innerHTML = html;

}

/* ==========================================
   RECEIPT TOTAL
========================================== */

function updateReceiptTotal() {

    const total =
        cart.reduce(
            (sum, item) =>
                sum +
                (item.price * item.count),
            0
        );

    $("#recieveAmount").text(
        formatMoney(total)
    );

}

/* ==========================================
   TOTAL CALCULATOR
========================================== */

function getCartTotal() {

    return cart.reduce(
        (sum, item) =>
            sum +
            (item.price * item.count),
        0
    );

}

/* ==========================================
   FORM VALIDATION  (บังคับกรอกทุกช่อง)
========================================== */

function validateCustomerForm() {

    const fields = [
        { id: "firstName" },
        { id: "lastName"  },
        { id: "email"     },
        { id: "address"   },
        { id: "province"  },
        { id: "zipcode"   },
        { id: "tel"       }
    ];

    let firstInvalid = null;

    // ล้างสถานะ error เดิม
    fields.forEach(f => {
        $("#" + f.id).removeClass("is-invalid");
    });

    fields.forEach(f => {

        const el = document.getElementById(f.id);
        const value = (el?.value || "").trim();

        let invalid = !value;

        // จังหวัด: ต้องไม่ใช่ค่า placeholder
        if (
            f.id === "province" &&
            (
                value === "" ||
                value === "เลือกจังหวัด" ||
                value === "กำลังโหลด..."
            )
        ) {
            invalid = true;
        }

        // อีเมล: ต้องเป็นรูปแบบที่ถูกต้อง
        if (
            f.id === "email" &&
            value &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ) {
            invalid = true;
        }

        // รหัสไปรษณีย์: ตัวเลข 5 หลัก
        if (
            f.id === "zipcode" &&
            value &&
            !/^\d{5}$/.test(value)
        ) {
            invalid = true;
        }

        // เบอร์โทร: ตัวเลข 9-10 หลัก
        if (
            f.id === "tel" &&
            value &&
            !/^\d{9,10}$/.test(value)
        ) {
            invalid = true;
        }

        if (invalid) {

            $("#" + f.id).addClass("is-invalid");

            if (!firstInvalid) {
                firstInvalid = f.id;
            }
        }

    });

    if (firstInvalid) {

        alert("กรุณากรอกข้อมูลให้ถูกต้องและครบทุกช่อง");

        document
            .getElementById(firstInvalid)
            ?.focus();

        return false;
    }

    return true;

}

/* ==========================================
   INIT
========================================== */

window.addEventListener(
    "DOMContentLoaded",
    () => {

        generateOrderNumber();

        loadProvince();

        loadCart();

        // เริ่มต้นให้แสดงเฉพาะข้อมูลผู้รับ
        $("#addresscheck").show();

        $("#detail3").hide();     // ซ่อนขนส่ง
        $("#detail2").hide();     // ซ่อนชำระเงิน

        $("#box3").hide();        // ซ่อนหัวข้อขนส่ง
        $("#box2").hide();        // ซ่อนหัวข้อชำระเงิน

        $("#block1").show();      // ปุ่มทำรายการต่อ

        $("#block2").hide();
        $("#block3").hide();

        $("#completebtn").hide(); // ซ่อนปุ่มยืนยัน

        // ลบสถานะ error ทันทีที่ผู้ใช้เริ่มแก้ไขช่องนั้น ๆ
        $("#firstName, #lastName, #email, #address, #zipcode, #tel")
            .on("input", function () {
                $(this).removeClass("is-invalid");
            });

        $("#province").on("change", function () {
            $(this).removeClass("is-invalid");
        });
    }
);

/* ==========================================
   PAYMENT METHOD (เลือกช่องทางชำระเงินอย่างเดียว)
   * ส่วน "ช่องทางติดต่อกลับ" ถูกตัดออกแล้ว *
========================================== */

function handleCheckboxChange(selectedCheckbox) {

    const id = selectedCheckbox.id;

    const paymentBoxes = [
        "checkboxqr",
        "checkboxtransfer",
        "checkboxcredit",
        "checkboxtruemoney"
    ];

    if (paymentBoxes.includes(id)) {

        // เลือกได้ทีละช่องทาง
        paymentBoxes.forEach(item => {

            if (item !== id) {

                const box = document.getElementById(item);
                if (box) box.checked = false;

            }

        });

        const payMap = {
            checkboxqr: "qr",
            checkboxtransfer: "transfer",
            checkboxcredit: "credit",
            checkboxtruemoney: "truemoney"
        };

        $("#paytype").text(payMap[id] || "");

    }

}

/* ==========================================
   STEP CONTROL
========================================== */

function openDetail1() {

    if (!validateCustomerForm()) {
        return;
    }

    $("#addresscheck").hide();

    $("#box3").show();
    $("#detail3").show();

    $("#box2").hide();
    $("#detail2").hide();

    $("#block1").hide();

    $("#block2").css(
        "display",
        "flex"
    );

    $("#block3").hide();

}
function openDetail2() {

    $("#addresscheck").show();

    $("#detail3").hide();

    $("#detail2").hide();

    $("#block1").show();

    $("#block2").hide();

    $("#block3").hide();

}

function openDetail3() {

    $("#addresscheck").hide();

    $("#box3").show();
    $("#detail3").hide();

    $("#box2").show();
    $("#detail2").show();

    $("#block1").hide();
    $("#block2").hide();

    $("#block3").css(
        "display",
        "flex"
    );

}

/* ==========================================
   MODAL
========================================== */

function closeQr1() {

    $("#qrpayment").hide();

}

function closeQr11() {

    // บังคับแนบสลิปก่อนยืนยันการชำระเงิน
    const fileInput =
        document.getElementById("inputGroupFile01");

    if (
        !fileInput ||
        !fileInput.files ||
        fileInput.files.length === 0
    ) {

        alert("กรุณาแนบสลิปการชำระเงินก่อน");

        return;
    }

    $("#qrpayment").hide();

    $("#completebtn")
        .prop("disabled", false)
        .show();

}

/* ==========================================
   PAYMENT VIEW
========================================== */

function showPromptPay() {

    $("#qrpay").show();

    $("#banktransfer").hide();

    $("#qrcredit").hide();

    $("#truemoney").hide();

}

function showTransfer() {

    $("#qrpay").hide();

    $("#banktransfer").show();

    $("#qrcredit").hide();

    $("#truemoney").hide();

}

function showCredit() {

    $("#qrpay").hide();

    $("#banktransfer").hide();

    $("#qrcredit").show();

    $("#truemoney").hide();

}

function showTrueMoney() {

    $("#qrpay").hide();

    $("#banktransfer").hide();

    $("#qrcredit").hide();

    $("#truemoney").show();

}

/* ==========================================
   OPEN PAYMENT
========================================== */

function openChoice() {

    const payType =
        $("#paytype")
        .text()
        .trim()
        .toLowerCase();

    if (!payType) {

        alert(
            "กรุณาเลือกช่องทางการชำระเงิน"
        );

        return;

    }

    $("#qrpayment").show();

    switch (payType) {

        case "qr":

            showPromptPay();

            openQrcode();

            break;

        case "transfer":

            showTransfer();

            break;

        case "credit":

            showCredit();

            break;

        case "truemoney":

            showTrueMoney();

            break;

        default:

            alert(
                "ไม่พบช่องทางชำระเงิน"
            );

            $("#qrpayment").hide();

            break;

    }

}

/* ==========================================
   PROMPTPAY QR  (สร้างฝั่ง client — ขึ้นทันที)
   มาตรฐาน EMVCo / BOT PromptPay
   ฝังจำนวนเงินอัตโนมัติจากยอดในตะกร้า
========================================== */

function ppSanitize(id) {

    return (id || "").replace(/[^0-9]/g, "");

}

function ppFormatTarget(id) {

    const numbers = ppSanitize(id);

    // 13 หลักขึ้นไป = เลขบัตรประชาชน / Tax ID / e-Wallet
    if (numbers.length >= 13) {
        return numbers;
    }

    // เบอร์มือถือ -> 0066xxxxxxxxx (13 หลัก)
    return ("0000000000000" + numbers.replace(/^0/, "66")).slice(-13);

}

function ppField(id, value) {

    const len = ("00" + value.length).slice(-2);

    return id + len + value;

}

// CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF)
function ppCrc16(data) {

    let crc = 0xFFFF;

    for (let i = 0; i < data.length; i++) {

        crc ^= data.charCodeAt(i) << 8;

        for (let j = 0; j < 8; j++) {

            crc = (crc & 0x8000)
                ? ((crc << 1) ^ 0x1021)
                : (crc << 1);

            crc &= 0xFFFF;

        }

    }

    return ("0000" + crc.toString(16).toUpperCase()).slice(-4);

}

function generatePromptPayPayload(target, amount) {

    const sanitized = ppSanitize(target);

    const targetType =
        sanitized.length >= 15 ? "03" :   // e-Wallet
        sanitized.length >= 13 ? "02" :   // Tax ID / บัตรประชาชน
        "01";                             // เบอร์มือถือ

    const merchantInfo =
        ppField("00", "A000000677010111") +              // AID PromptPay
        ppField(targetType, ppFormatTarget(target));

    // ลำดับ tag แบบเดียวกับ promptpay.io / dtinth: 58 (ประเทศ) -> 53 (สกุลเงิน) -> 54 (จำนวนเงิน)
    // เป็นรูปแบบที่แอปธนาคารไทยทุกตัวยอมรับ (บางแอปตรวจลำดับ field เข้มงวด)
    let payload =
        ppField("00", "01") +                            // payload format
        ppField("01", amount ? "12" : "11") +            // 12 = dynamic (มีจำนวนเงิน)
        ppField("29", merchantInfo) +                    // ข้อมูล PromptPay
        ppField("58", "TH");                             // country

    payload += ppField("53", "764");                     // currency = THB

    if (amount) {
        payload += ppField("54", Number(amount).toFixed(2)); // จำนวนเงิน
    }

    payload += "6304";                                   // CRC tag + length
    payload += ppCrc16(payload);

    return payload;

}

/* URL ของ API สร้าง QR ฝั่งเซิร์ฟเวอร์ (ใช้ promptpay-qr = รูปแบบเดียวกับ promptpay.io)
   - รันในเครื่อง: http://localhost:3000/generate-qr
   - ถ้า deploy แล้ว เปลี่ยนเป็น URL จริง เช่น https://your-api.onrender.com/generate-qr */
const QR_API_URL = "http://kbank-api-proxy.vercel.app/generate-qr";

/* สร้าง QR ในเครื่องแบบ offline (สำรอง) จาก payload ที่ฝังในไฟล์นี้ */
function renderQRtoDataURL(text, opts) {

    opts = opts || {};
    const ec      = opts.ec || "M";
    const sizePx  = opts.width || 300;
    const margin  = (opts.margin == null) ? 4 : opts.margin; // quiet zone (หน่วย module)

    const qr    = QRCodeLocal.make(text, ec);
    const count = qr.size;
    const total = count + margin * 2;

    let scale = Math.floor(sizePx / total);
    if (scale < 1) scale = 1;

    const canvasSize = scale * total;
    const canvas = document.createElement("canvas");
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = "#000000";

    for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
            if (qr.modules[r][c]) {
                ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale);
            }
        }
    }

    return canvas.toDataURL("image/png");

}

/* สร้าง QR แบบในเครื่อง (ใช้เป็นตัวสำรองเมื่อเรียก API ไม่ได้) */
function generateQrLocal(amount) {

    const ppId = CONFIG.promptPayId;

    if (!ppId) {
        alert("ยังไม่ได้ตั้งค่าหมายเลข PromptPay ของร้าน");
        return;
    }

    const payload = generatePromptPayPayload(ppId, amount);

    document.getElementById("qrImage").src =
        renderQRtoDataURL(payload, { width: 300, margin: 4, ec: "M" });

}

function openQrcode() {

    const amount = getCartTotal();

    if (!amount) {
        alert("ไม่มีสินค้าในตะกร้า");
        return;
    }

    // เรียก API ให้สร้าง QR ตามยอดในตะกร้าอัตโนมัติ
    fetch(QR_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
    })
    .then(r => r.json())
    .then(data => {

        if (data && data.RespCode === 200 && data.result) {
            document.getElementById("qrImage").src = data.result;
        } else {
            throw new Error(data && data.RespMessage ? data.RespMessage : "API error");
        }

    })
    .catch(err => {

        // เรียก API ไม่ได้ -> ใช้ตัวสร้างในเครื่องสำรอง (offline)
        console.warn("QR API ใช้ไม่ได้ ใช้ตัวสำรองในเครื่องแทน:", err);

        try {
            generateQrLocal(amount);
        } catch (e) {
            console.error("QR error:", e);
            alert("สร้าง QR ไม่สำเร็จ: " + (e && e.message ? e.message : e));
        }

    });

}

/* ==========================================
   CUSTOMER DATA
========================================== */

function getCustomerData() {

    return {

        orderNumber:
        $("#ordernumber").text(),

        name:
        $("#firstName").val(),

        lastname:
        $("#lastName").val(),

        address:
        $("#address").val(),

        province:
        $("#province").val(),

        zipcode:
        $("#zipcode").val(),

        tel:
        $("#tel").val(),

        email:
        $("#email").val(),

        detail:
        $("#sentback").text(),

        cart

    };

}

/* ==========================================
   SEND LINE MESSAGE
========================================== */

async function sendLineMessage() {

    const data =
        getCustomerData();

    let message =
        `📦 ออเดอร์ใหม่\n\n`;

    message +=
        `เลขคำสั่งซื้อ : ${data.orderNumber}\n`;

    message +=
        `ผู้รับ : ${data.name} ${data.lastname}\n`;

    message +=
        `โทร : ${data.tel}\n`;

    message +=
        `อีเมล : ${data.email}\n`;

    message +=
        `ที่อยู่ : ${data.address} ${data.province} ${data.zipcode}\n\n`;

    message +=
        `รายการสินค้า\n`;

    data.cart.forEach((item,index)=>{

        message +=
            `${index+1}. ${item.name} x ${item.count}\n`;

    });

    message +=
        `\nยอดรวม : ${formatMoney(getCartTotal())} บาท`;

    const response =
        await fetch(
            CONFIG.lineApi,
            {
                method:"POST",

                headers:{
                    "Content-Type":
                    "application/json"
                },

                body:
                JSON.stringify({

                    message

                })
            }
        );

    if(!response.ok){

        throw new Error(
            "Line API Error"
        );

    }

}

/* ==========================================
   SAVE TO SHEET
========================================== */

async function saveOrderToSheet() {

    const data =
        getCustomerData();

    const response =
        await fetch(
            CONFIG.sheetApi,
            {
                method:"POST",

                headers:{
                    "Content-Type":
                    "application/json"
                },

                body:
                JSON.stringify(data)
            }
        );

    if(!response.ok){

        throw new Error(
            "Sheet API Error"
        );

    }

}

/* ==========================================
   SEND ALL
========================================== */

async function sendAll(event) {

    event?.preventDefault();

    try {

        if(!cart.length){

            alert(
                "ไม่มีสินค้าในตะกร้า"
            );

            return;

        }

        showLoading();

        await sendLineMessage();

        await saveOrderToSheet();

        await printLabel();

        alert(
            "คำสั่งซื้อสำเร็จ"
        );

        clearCart();

        resetForm();
       setTimeout(() => {
    window.location.href = "index.html";
}, 1000);

    }
    catch(error){

        console.error(error);

        alert(
            "เกิดข้อผิดพลาด กรุณาลองใหม่"
        );

    }
    finally{

        hideLoading();

    }

}

/* ==========================================
   CLEAR CART
========================================== */

function clearCart() {

    localStorage.removeItem(
        "cart"
    );

    cart = [];

    renderSummaryCart();

    renderReceiptTable();

    updateReceiptTotal();

}

/* ==========================================
   RESET FORM
========================================== */

function resetForm() {

    $("#firstName").val("");
    $("#lastName").val("");

    $("#address").val("");

    $("#province")
        .prop(
            "selectedIndex",
            0
        );

    $("#zipcode").val("");
    $("#tel").val("");
    $("#email").val("");

    $("#paytype").text("");

    $("#sentback").text("Email");

    $(".form-check-input")
        .prop(
            "checked",
            false
        );

    $(".is-invalid").removeClass("is-invalid");

    $("#completebtn")
        .prop(
            "disabled",
            true
        );

    generateOrderNumber();

}

/* ==========================================
   RECEIPT HEADER
========================================== */

function createReceiptHeader() {

    const data =
        getCustomerData();

    const now =
        new Date();

    const date =
        now.toLocaleDateString(
            "th-TH"
        );

    const html = `

    <div class="container-recieve">

        <div class="p-3">

            <div
            class="recieve-header">

                <div>

                    <strong>
                    MENZSHOPS
                    </strong>

                    <br>

                    Nonthaburi 11000

                </div>

                <div>

                    <h4>
                    ใบเสร็จรับเงิน
                    </h4>

                </div>

            </div>

            <hr>

            <div
            class="recieve-header">

                <div>

                    เลขคำสั่งซื้อ

                    <br>

                    ${data.orderNumber}

                </div>

                <div>

                    ${date}

                </div>

            </div>

            <br>

            <div>

                ผู้รับ :
                ${data.name}
                ${data.lastname}

                <br>

                โทร :
                ${data.tel}

                <br>

                ที่อยู่ :

                ${data.address}

                ${data.province}

                ${data.zipcode}

            </div>

        </div>

    </div>

    `;

    $("#headrecieve")
        .html(html);

}

/* ==========================================
   PRINT LABEL
========================================== */

async function printLabel() {

    createReceiptHeader();

    renderReceiptTable();

    updateReceiptTotal();

    await new Promise(resolve => {

        setTimeout(
            resolve,
            500
        );

    });

    await downloadPDF();

}

/* ==========================================
   DOWNLOAD PDF
========================================== */

async function downloadPDF() {

    const element =
        document.getElementById(
            "print-area"
        );

    return html2pdf()

        .set({

            margin:0,

            filename:
            `receipt-${Date.now()}.pdf`,

            image:{
                type:"jpeg",
                quality:0.98
            },

            html2canvas:{
                scale:2,
                useCORS:true
            },

            jsPDF:{
                unit:"mm",
                format:"a5",
                orientation:"portrait"
            }

        })

        .from(element)

        .save();

}

/* ==========================================
   EXTRA VALIDATION
========================================== */

function validateBeforeSubmit() {

    if(!validateCustomerForm()){

        return false;

    }

    if(!$("#paytype").text()){

        alert(
            "กรุณาเลือกช่องทางชำระเงิน"
        );

        return false;

    }

    return true;

}

/* ==========================================
   OVERRIDE SEND ALL
========================================== */

const originalSendAll =
    sendAll;

sendAll = async function(event){

    if(
        !validateBeforeSubmit()
    ){

        return;

    }

    await originalSendAll(
        event
    );

};
