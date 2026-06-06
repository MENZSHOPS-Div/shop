/* ==========================================
   GLOBAL STATE
========================================== */

let cart = [];

const CONFIG = {
    provinceApi:
    "https://script.google.com/macros/s/AKfycbwHU1aqw9TATKgHVNcTFSBomSWAdzortx8dgaKAdjfQstl30yb34jtziUk-XTjcHi134g/exec",

    qrApi:
    "https://kbank-api-proxy.onrender.com/generate-qr",

    lineApi:
    "https://line-api-backend.onrender.com/push",

    sheetApi:
    "https://sheet-backend-lsg9.onrender.com/save-order"
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
            `<option selected disabled>
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
            `<option>
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
   FORM VALIDATION
========================================== */

function validateCustomerForm() {

    const requiredFields = [

        "firstName",
        "lastName",
        "address",
        "province",
        "zipcode",
        "tel"

    ];

    for (const field of requiredFields) {

        const value =
            document
            .getElementById(field)
            ?.value
            ?.trim();

        if (!value) {

            alert(
                "กรุณากรอกข้อมูลให้ครบถ้วน"
            );

            return false;

        }

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
    }
);
/* ==========================================
   CONTACT METHOD
========================================== */

function handleCheckboxChange(selectedCheckbox) {

    const id = selectedCheckbox.id;

    /* --------------------------
       CONTACT
    -------------------------- */

    if (
        id === "checkboxLine" ||
        id === "checkboxPhone" ||
        id === "checkboxEmail"
    ) {

        const contactBoxes = [

            "checkboxLine",
            "checkboxPhone",
            "checkboxEmail"

        ];

        contactBoxes.forEach(item => {

            if (item !== id) {

                document.getElementById(item)
                    .checked = false;

            }

        });

        $("#line").addClass("d-none");
        $("#mobile").addClass("d-none");
        $("#mail").addClass("d-none");

        if (id === "checkboxLine") {

            $("#line").removeClass("d-none");

            $("#sentback").text("LINE");

        }

        if (id === "checkboxPhone") {

            $("#mobile").removeClass("d-none");

            $("#sentback").text("Tel");

        }

        if (id === "checkboxEmail") {

            $("#mail").removeClass("d-none");

            $("#sentback").text("Email");

        }

        return;

    }

    /* --------------------------
       PAYMENT
    -------------------------- */

    const paymentBoxes = [

        "checkboxqr",
        "checkboxtransfer",
        "checkboxcredit",
        "checkboxtruemoney"

    ];

    if (paymentBoxes.includes(id)) {

        paymentBoxes.forEach(item => {

            if (item !== id) {

                document.getElementById(item)
                    .checked = false;

            }

        });

        const payMap = {

            checkboxqr: "qr",
            checkboxtransfer: "transfer",
            checkboxcredit: "credit",
            checkboxtruemoney: "truemoney"

        };

        $("#paytype").text(
            payMap[id]
        );

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
   QR PAYMENT
========================================== */

async function openQrcode() {

    try {

        showLoading();

        const amount =
            getCartTotal();

        const response =
            await fetch(
                CONFIG.qrApi,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                        "application/json"
                    },

                    body:
                    JSON.stringify({

                        amount

                    })

                }
            );

        const data =
            await response.json();

        if (
            data.RespCode === 200 &&
            data.result
        ) {

            document
            .getElementById("qrImage")
            .src = data.result;

        }
        else {

            throw new Error(
                data.RespMessage ||
                "QR Error"
            );

        }

    }
    catch (error) {

        console.error(error);

        alert(
            "ไม่สามารถสร้าง QR Code ได้"
        );

    }
    finally {

        hideLoading();

    }

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
        `ติดต่อกลับ : ${data.detail} ${data.email}\n`;

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

    $("#sentback").text("");

    $(".form-check-input")
        .prop(
            "checked",
            false
        );

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
