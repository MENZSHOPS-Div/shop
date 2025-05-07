 <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>


function handleCheckboxChange(selectedCheckbox) {
    // ดึง checkbox ทั้งหมด
    const checkboxes = document.querySelectorAll('.form-check-input');

    // ปิดช่องอื่น ๆ ยกเว้นช่องที่เลือก
    checkboxes.forEach(checkbox => {
        if (checkbox !== selectedCheckbox) {
            checkbox.checked = false;
        }
    });

    // เรียกฟังก์ชันเมื่อมีการเลือก
    if (selectedCheckbox.checked) {
        switch (selectedCheckbox.id) {
            case "checkboxLine":
                function1();
                break;
            case "checkboxPhone":
                function2();
                break;
            case "checkboxEmail":
                function3();
                break;
        }
    }
}


function function1() {
    $("#line").css('display', 'flex');
    $("#mobile").css('display', 'none');
    $("#mail").css('display', 'none');
    var sentback = document.getElementById("sentback");
    sentback.innerText = "LINE";
}

function function2() {
    $("#line").css('display', 'none');
    $("#mobile").css('display', 'flex');
    $("#mail").css('display', 'none');
    var sentback = document.getElementById("sentback");
    sentback.innerText = "Tel";
}

function function3() {
    $("#line").css('display', 'none');
    $("#mobile").css('display', 'none');
    $("#mail").css('display', 'flex');
    var sentback = document.getElementById("sentback");
    sentback.innerText = "Email";
}

function loadProvince() {
    const scriptURL = "https://script.google.com/macros/s/AKfycbwHU1aqw9TATKgHVNcTFSBomSWAdzortx8dgaKAdjfQstl30yb34jtziUk-XTjcHi134g/exec"; // ใส่ลิงก์ Web App ที่คุณได้มา

    fetch(scriptURL)
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById("province");
            select.innerHTML = '<option selected disabled>เลือกจังหวัด</option>';

            data.forEach(province => {
                const option = document.createElement("option");
                option.value = province;
                option.textContent = province;
                select.appendChild(option);
            });
        })
        .catch(err => {
            console.error("Error fetching provinces:", err);
            document.getElementById("province").innerHTML = '<option>Error loading provinces</option>';
        });
}


function handleCheckboxChange(selectedCheckbox) {
    // ดึง checkbox ทั้งหมด
    const checkboxes = document.querySelectorAll('.form-check-input');

    // ปิดช่องอื่น ๆ ยกเว้นช่องที่เลือก
    checkboxes.forEach(checkbox => {
        if (checkbox !== selectedCheckbox) {
            checkbox.checked = false;
        }
    });

    // เรียกฟังก์ชันเมื่อมีการเลือก
    if (selectedCheckbox.checked) {
        switch (selectedCheckbox.id) {
            case "checkboxqr":
                var sent = document.getElementById("paytype");
                sent.innerText = "";
                sent.innerText = "qr";
                break;
            case "checkboxtransfer":
                var sent = document.getElementById("paytype");
                sent.innerText = "";
                sent.innerText = "transfer";
                break;
            case "checkboxcredit":
                var sent = document.getElementById("paytype");
                sent.innerText = "";
                sent.innerText = "credit";
                break;
            case "checkboxtruemoney":
                var sent = document.getElementById("paytype");
                sent.innerText = "";
                sent.innerText = "truemoney";
                break;
        }
    }
}


function function11() {
    $("#qrpayment").css('display', 'block');
    $("#qrpay").css('display', 'block');
    $("#banktransfer").css('display', 'none');
    $("#qrcredit").css('display', 'none');
    $("#truemoney").css('display', 'none');

}

function function12() {
    $("#qrpayment").css('display', 'block');
    $("#qrpay").css('display', 'none');
    $("#banktransfer").css('display', 'block');
    $("#qrcredit").css('display', 'none');
    $("#truemoney").css('display', 'none');
}

function function13() {
    $("#qrpayment").css('display', 'block');
    $("#qrpay").css('display', 'none');
    $("#banktransfer").css('display', 'none');
    $("#qrcredit").css('display', 'block');
    $("#truemoney").css('display', 'none');
}

function function14() {
    $("#qrpayment").css('display', 'block');
    $("#qrpay").css('display', 'none');
    $("#banktransfer").css('display', 'none');
    $("#qrcredit").css('display', 'none');
    $("#truemoney").css('display', 'block');
}

function openDetail1() {

    $("#addresscheck").css('display', 'none');
    $("#block1").css('display', 'none');
    $("#block2").css('display', 'flex');
    $("#block3").css('display', 'none');
    $("#box1").css('display', 'block');
    $("#box2").css('display', 'none');
    $("#box3").css('display', 'block');
    $("#detail2").css('display', 'none');
    $("#detail3").css('display', 'block');

}

function openDetail2() {

    $("#addresscheck").css('display', 'block');
    $("#block1").css('display', 'block');
    $("#block2").css('display', 'none');
    $("#block3").css('display', 'none');
    $("#box1").css('display', 'none');
    $("#box2").css('display', 'none');
    $("#box3").css('display', 'none');
    $("#detail2").css('display', 'none');
    $("#detail3").css('display', 'none');

}

function openDetail3() {

    $("#addresscheck").css('display', 'none');
    $("#block1").css('display', 'none');
    $("#block2").css('display', 'none');
    $("#block3").css('display', 'flex');
    $("#box1").css('display', 'block');
    $("#box2").css('display', 'block');
    $("#box3").css('display', 'block');
    $("#detail2").css('display', 'block');
    $("#detail3").css('display', 'none');

}

function closeQr1() {
    $("#qrpayment").css('display', 'none');
}

function closeQr2() {
    $("#banktransfer").css('display', 'none');
}

function closeQr3() {
    $("#qrcredit").css('display', 'none');
}

function closeQr4() {
    $("#truemoney").css('display', 'none');
}

function closeQr11() {
    $("#qrpayment").css('display', 'none');
    $("#completebtn").prop("disabled", false);
}

function closeQr21() {
    $("#banktransfer").css('display', 'none');
    $("#completebtn").prop("disabled", false);

}

function closeQr31() {
    $("#qrcredit").css('display', 'none');
    $("#completebtn").prop("disabled", false);

}

function closeQr41() {
    $("#truemoney").css('display', 'none');
    $("#completebtn").prop("disabled", false);

}

let cart = [];

function orderRender() {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
        renderSummaryCart();
        renderRecieve(); 
        getRecieveAmount();
    } else {
        document.getElementById("summaryCart").innerHTML = `<p>ไม่มีสินค้าในตะกร้า</p>`;
    }
};

function numberWithCommas(x) {
    return parseFloat(x).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function renderSummaryCart() {
    if (cart.length > 0) {
        let html = '';
        let totalPrice = 0;

        for (let i = 0; i < cart.length; i++) {
            let itemTotal = cart[i].price * cart[i].count;
            totalPrice += itemTotal;

            html += `  
     <li class="list-group-item d-flex justify-content-between lh-sm" style="border-radius: 0px;">
                    <div class="border border-bottom">
                        <h6 class="my-0">${cart[i].name}</h6>
                       
                    </div>
                    <span class="text-body-secondary">${cart[i].count}</span>
                </li>

  `;
        }

        document.getElementById("summaryCart").innerHTML = html;
        $("#amount").text(numberWithCommas(totalPrice));
        $("#total1").text(numberWithCommas(totalPrice));
        $("#total2").text(numberWithCommas(totalPrice));
        $("#total3").text(numberWithCommas(totalPrice));
        $("#total4").text(numberWithCommas(totalPrice));
    } else {
        document.getElementById("summaryCart").innerHTML = `<p>ไม่มีสินค้าในตะกร้า</p>`;
    }
}

function renderRecieve() {
    if (cart.length > 0) {
        let html = '';
        let totalPrice = 0;

        for (let i = 0; i < cart.length; i++) {
            let itemTotal = cart[i].price * cart[i].count;
            totalPrice += itemTotal;

            html += `  <tr>
                      <td class="col atype">${cart[i].name}</td>
                      <td class="col btype">${cart[i].count}</td>
                      <td class="col btype text-end">${itemTotal}</td>
          </tr>
  `;

  document.getElementById("bodyrecieve").innerHTML = html;
        }  

    }

    else {
        document.getElementById("bodyrecieve").innerHTML = `<p>ไม่มีสินค้าในตะกร้า</p>`;
    }
}

function getRecieveAmount(){
    if (cart.length > 0) {
        let html = '';
        let totalPrice = 0;

        for (let i = 0; i < cart.length; i++) {
            let itemTotal = cart[i].price * cart[i].count;
            totalPrice += itemTotal;
       
        document.getElementById('recieveAmount').innerHTML = totalPrice ;
}}
}

function openChoice() {
    var choice = document.getElementById('paytype').textContent.trim().toLowerCase();
    if (choice === "qr") {
        function11();
    } else if (choice === "transfer") {
        function12();
    } else if (choice === "credit") {
        function13();
    } else if (choice === "truemoney") {
        function14();
    } else {
        alert('กรุณาเลือกช่องทางการชำระเงินที่ถูกต้อง');
    }
}


async function sendLineMessage() {

    if (cart.length > 0) {


        let orderNumber = document.getElementById("ordernumber")?.textContent || "ไม่มีข้อมูล";
        let name = document.getElementById("firstName")?.value || "ไม่มีข้อมูล";
        let lastname = document.getElementById("lastName")?.value || "ไม่มีข้อมูล";
        let address = document.getElementById("address")?.value || "ไม่มีข้อมูล";
        let province = document.getElementById("province")?.value || "ไม่มีข้อมูล";
        let zipcode = document.getElementById("zipcode")?.value || "ไม่มีข้อมูล";
        let tel = document.getElementById("tel")?.value || "ไม่มีข้อมูล";
        let email = document.getElementById("email")?.value || "ไม่มีข้อมูล";
        let detail = document.getElementById("sentback")?.textContent || "ไม่มีข้อมูล";

        let fulladdress = `${name} ${lastname} ${address} ${province} ${zipcode}`;
        let message = `📦 *ออเดอร์ใหม่!* \n\n` +
            `🛒 *Order Number:* ${orderNumber}\n` +
            `🏠 *ที่อยู่:* ${fulladdress}\n` +
            `📞 *เบอร์โทร:* ${tel}\n\n` +
            `📧 *ติดต่อกลับ:* ${detail} ${email}\n` +
            `🛍 *รายการสินค้า:*\n`;

        cart.forEach((item, index) => {
            message += `\n${index + 1}. ${item.name} x ${item.count}`;
        });

        message += `\n\n💰 *ยอดรวมทั้งหมด:* ${cart.reduce((sum, item) => sum + item.price * item.count, 0)}฿`;

        try {
            const response = await fetch("https://line-api-backend.onrender.com/push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: message })
            });

            const result = await response.json();
            console.log(result);

            if (response.ok) {
                alert("✅ ขอบคุณสำหรับคำสั่งซื้อครับ! ติดตามสถานะจัดส่งและใบเสร็จที่อีเมลของท่าน ✅ ติดต่อแอดมิน LINE: @MENZSHOPS");


                document.getElementById("ordernumber").textContent = " ";
                document.getElementById("firstName").value = " ";
                document.getElementById("lastName").value = " ";
                document.getElementById("address").value = " ";
                document.getElementById("province").value = " ";
                document.getElementById("zipcode").value = " ";
                document.getElementById("tel").value = " ";
                document.getElementById("email").value = " ";

                await sentDataToSheet({
                    orderNumber,
                    name,
                    lastname,
                    address,
                    province,
                    zipcode,
                    tel,
                    email,
                    detail,
                    cart
                });
            }
        } catch (error) {
            console.error("เกิดข้อผิดพลาด:", error);
        }
    }
}

async function sendAll(event) {
    event?.preventDefault(); // ป้องกัน form submit ถ้ามี

    $("#waiting").css('display', 'flex');
    await sendLineMessage();
    $("#waiting").css('display', 'none');
    
    setTimeout(() => {
        printLabel();
        }, 200);
}


async function sentDataToSheet(orderData) {
    try {
        await fetch("https://sheet-backend-lsg9.onrender.com/save-order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(orderData)
        });
    } catch (error) {
        console.error("ส่งข้อมูลไปยัง backend ไม่สำเร็จ:", error);
    }
}





async function openQrcode() {
    $("#waiting").css('display', 'flex');
    const amount = document.getElementById('amount').textContent;
    console.log("Amount:", amount);
    const response = await fetch('https://kbank-api-proxy.onrender.com/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
    });

    const data = await response.json();

    if (data.RespCode === 200 && data.result) {
        document.getElementById('qrImage').src = data.result;

    } else {
        alert('เกิดข้อผิดพลาด: ' + (data.RespMessage || 'ไม่สามารถสร้าง QR ได้'));
    }

    $("#waiting").css('display', 'none');
}

function generateOrderNumber() {
    let orderNumber = Math.floor(10000000 + Math.random() * 90000000); // สุ่มเลข 8 หลัก
    document.getElementById("ordernumber").textContent = orderNumber; // แสดงผลใน HTML
}


function printLabel() {
    let recievorderNumber = document.getElementById("ordernumber")?.textContent || "ไม่มีข้อมูล";
    let name = document.getElementById("firstName")?.value || "ไม่มีข้อมูล";
    let lastname = document.getElementById("lastName")?.value || "ไม่มีข้อมูล";
    let recieveFullName = `${name} ${lastname}`;
    let address = document.getElementById("address")?.value || "ไม่มีข้อมูล";
    let province = document.getElementById("province")?.value || "ไม่มีข้อมูล";
    let zipcode = document.getElementById("zipcode")?.value || "ไม่มีข้อมูล";
    let tel = document.getElementById("tel")?.value || "ไม่มีข้อมูล";
    let email = document.getElementById("email")?.value || "ไม่มีข้อมูล";
    let detail = document.getElementById("sentback")?.textContent || "ไม่มีข้อมูล";
    let fulladdress = `${address} ${province} ${zipcode}`;
const html = `
     <div class="container-recieve">
              <div class="container p-4">
                  <div class="recieve-header">
                      <div class="fs-6" style="line-height: 1;">
                          <p style="font-size: 0.70rem;" >MENZSHOPS<br>
                             Lumpini Park<br>
                             Nonthaburi 11000</p>
                      </div>
                      <div class="fs-2">
                          <p>ใบเสร็จรับเงิน</p>
                      </div>
                  </div>
          
                  <div class="recieve-header mt-3">
                   <div class="fs-6">
                      <p id="recievehead" style="font-size: 0.70rem;">เลขคำสั่งซื้อ :</p>
                   </div> 
                   <div class="fs-6">
                      <p style="font-size: 0.70rem;">12/01/2568</p>
                   </div> 
                 </div>
                 <div style="font-size: 0.70rem;">
                  <p id="recieveaddress">ได้รับเงินจาก : ${recieveFullName}<br>
                  ที่อยู่สำหรับจัดส่ง : ${fulladdress} <br>
                  โทร : ${tel}</p>
                 </div>
                 
          
`;

const printArea = document.getElementById('headrecieve');
printArea.innerHTML = html;
renderRecieve();
// ✅ รอให้ DOM render เสร็จก่อนเรียก downloadPDF
setTimeout(() => {
downloadPDF();
}, 200);
}

function downloadPDF() {
    const element = document.getElementById('capture-area');

    html2canvas(element, {
      scale: 2,
      useCORS: true
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a5');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // เปิดไฟล์ในแท็บใหม่
      const pdfBlobUrl = pdf.output('bloburl');
      window.open(pdfBlobUrl, '_blank');
    });
}


window.onload = function () {
    orderRender();
    loadProvince();
    openDetail2();
    generateOrderNumber();
    openQrcode();
}
