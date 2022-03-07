// get user balance
const getBalance = async function () {
    // const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
    // const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
    // document.getElementById("navBalance").innerHTML = `${cUSDBalance} cUSD`
    // document.getElementById("modalBalance").innerHTML = `Balance: <b>10 cUSD</b>`
}

// save user data on data submission
saveUserDataBtn.addEventListener("click", evt => {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    if (name === "") {
        console.error("Name can't be empty!");
    } else if (email === "") {
        console.error("Email can't be empty!");
    } else {
        localStorage.setItem("name", name);
        localStorage.setItem("email", email);
        location.reload();
    }
})

// on screen load
window.addEventListener("load", () => {
    let slider = document.querySelector(".slide-in-down");
    if (slider.classList.contains("opened")) {
        slider.classList.remove("opened");
        slider.classList.add("closed");
    } else {
        slider.classList.remove("closed");
        slider.classList.add("opened");
    }
    if (localStorage.getItem("name") && localStorage.getItem("email")) {
        document.getElementById("dataCollection").style.display = "none";
        document.getElementById("username").innerText = `${localStorage.getItem("name")}`
        document.getElementById("modalUsername").innerText = `${localStorage.getItem("name")}`
        document.getElementById("modalEmail").innerHTML = `Email: <a href="mailto:${localStorage.getItem("email")}">${localStorage.getItem("email")}</a>`
    }
    await getBalance()
});
