import Web3 from "web3"
import { newKitFromWeb3 } from "@celo/contractkit"
import BigNumber from "bignumber.js"
import DrugyMarketplaceAbi from "../contract/drugy.abi.json"
import erc20Abi from "../contract/erc20.abi.json"
import { ERC20_DECIMALS, contractAddress, cUSDContractAddress } from './utils/constants';

let kit
let contract
// let drugs = [
//     {
//         name: "Giant BBQ",
//         image: "https://i.imgur.com/yPreV19.png",
//         description: `Grilled chicken, beef, fish, sausages, bacon, 
//           vegetables served with chips.`,
//         owner: "0x32Be343B94f860124dC4fEe278FDCBD38C102D88",
//         price: 1,
//         isSold: true,
//         index: 0,
//     },
//     {
//         name: "BBQ Chicken",
//         image: "https://i.imgur.com/NMEzoYb.png",
//         description: `French fries and grilled chicken served with gacumbari 
//           and avocados with cheese.`,
//         owner: "0x3275B7F400cCdeBeDaf0D8A9a7C8C1aBE2d747Ea",
//         price: 2,
//         isSold: false,
//         index: 1,
//     },
// ]
let drugs = []
let isAdmin = false

// connect to celo
const connectCeloWallet = async () => {
    if (window.celo) {
        notification("⚠️ Please approve this DApp to use it.")
        try {
            await window.celo.enable()
            notificationOff()

            const web3 = new Web3(window.celo)
            kit = newKitFromWeb3(web3)

            const accounts = await kit.web3.eth.getAccounts()
            kit.defaultAccount = accounts[0]

            contract = new kit.web3.eth.Contract(DrugyMarketplaceAbi, contractAddress)
        } catch (error) {
            notification(`⚠️ ${error}.`)
        }
    } else {
        notification("⚠️ Please install the CeloExtensionWallet.")
    }
}

// approve transaction
async function approve(_price) {
    const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)

    const result = await cUSDContract.methods
        .approve(contractAddress, _price)
        .send({ from: kit.defaultAccount })
    return result
}

// get user balance
const getBalance = async () => {
    const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
    const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
    const celoBalance = totalBalance.CELO.shiftedBy(-ERC20_DECIMALS).toFixed(2)
    document.getElementById("navBalance").innerHTML = `${cUSDBalance} cUSD | ${celoBalance} CELO`
    document.getElementById("modalBalance").innerHTML = `Balance: <b>${cUSDBalance} cUSD | ${celoBalance} CELO</b>`
}

// get drugs from blockchain
const getDrugs = async function () {
    const _drugsLength = await contract.methods.getDrugsLength().call()
    const _drugs = []
    for (let i = 0; i < _drugsLength; i++) {
        let _cloth = new Promise(async (resolve) => {
            let d = await contract.methods.getDrug(i).call()
            resolve({
                index: i,
                owner: d[0],
                name: d[1],
                image: d[2],
                description: d[3],
                price: new BigNumber(d[4]),
                isSold: d[5],
            })
        })
        _drugs.push(_cloth)
    }
    drugs = await Promise.all(_drugs)
    renderDrugs()
}

// render drugs to dom
function renderDrugs() {
    document.getElementById("drugMarketplace").innerHTML = ""
    drugs.forEach((_drug) => {
        const newDiv = document.createElement("div")
        newDiv.className = "col-sm-3"
        newDiv.innerHTML = drugTemplate(_drug)
        document.getElementById("drugMarketplace").appendChild(newDiv)
    })
}

// drug template
function drugTemplate(_drug) {
    return `
        <div class="card shadow position-relative" style="height: 400px">
            <img
                src="${_drug.image}"
                class="card-img-top"
                style="height: 200px; object-fit: cover"
                alt="${_drug.name}"
            />
            <div class="card-body">
                <a
                    id="company"
                    href="https://alfajores-blockscout.celo-testnet.org/address/${_drug.owner}/transactions"
                    target="_blank"
                    class="company shadow bg-dark text-light align-middle position-absolute"
                    >
                    Company
                </a>
                <h5 class="card-title fw-bold">
                    ${_drug.name}
                    ${_drug.isSold
            ?
            `<span
                        style="font-size: 12px"
                        class="btn btn-sm btn-success disabled"
                        >SOLD!</span
                        >` : `<span
                        style="font-size: 12px"
                        class="btn btn-sm btn-outline-secondary"
                        >${_drug.price.shiftedBy(-ERC20_DECIMALS).toFixed(2)} cUSD</span
                        >`}
                </h5>
                <p
                class="card-text fw-light overflow-hidden"
                style="height: 80px"
                >
                    ${_drug.description}
                </p>
                <div class="d-flex justify-content-between">
                    ${_drug.isSold ? `<a href="#" class="btn btn-dark disabled">Buy Now!</a>` : `<a id="${_drug.index}" href="#" class="btn btn-dark buyDrugNow">Buy Now!</a>`}
                    ${_drug.isReported ? `<a href="#" class="btn btn-danger float-right disabled">Report</a>` : `<a id="${_drug.index}" href="#" class="btn btn-danger float-right reportDrug">Report</a>`}
                </div>
            </div>
        </div>
        `
}

// render add drug to dom
async function renderAddDrug() {
    if (await contract.methods.isUserAdmin(kit.defaultAccount).call()) {
        isAdmin = true
    } else {
        document.getElementById("addDrugContainer").remove()
    }
}

// buying and reporting drug
drugMarketplace.addEventListener("click", async (e) => {
    // buying drug
    if (e.target.className.includes("buyDrugNow")) {
        const index = e.target.id
        notification("⌛ Waiting for payment approval...")
        try {
            await approve(drugs[index].price)
        } catch (error) {
            notification(`⚠️ ${error}.`)
        }
        notification(`⌛ Awaiting payment for "${drugs[index].name}"...`)
        try {
            await contract.methods
                .buyDrug(index)
                .send({ from: kit.defaultAccount })
            notification(`🎉 You successfully bought "${drugs[index].name}".`)
            getDrugs()
            getBalance()
        } catch (error) {
            notification(`⚠️ ${error}.`)
        }
    }

    // reporting drug
    if (e.target.className.includes("reportDrug")) {
        const index = e.target.id
        notification("⌛ Waiting for payment approval...")
        try {
            await approve(drugs[index].price)
        } catch (error) {
            notification(`⚠️ ${error}.`)
        }
        notification(`⌛ Awaiting payment for report on "${drugs[index].name}"...`)
        try {
            await contract.methods
                .reportDrug(index)
                .send({ from: kit.defaultAccount })
            notification(`🎉 You successfully reported "${drugs[index].name}".`)
            getDrugs()
            getBalance()
        } catch (error) {
            notification(`⚠️ ${error}.`)
        }
    }
})

// adding drug
addNewDrug.addEventListener("click", async () => {
    const _drug = [
        document.getElementById("drugName").value,
        document.getElementById("drugImage").value,
        document.getElementById("drugDescription").value,
        new BigNumber(document.getElementById("drugPrice").value)
            .shiftedBy(ERC20_DECIMALS)
            .toString()
    ]
    notification(`⌛ Adding "${_drug[0]}"...`)
    try {
        await contract.methods
            .addDrug(..._drug)
            .send({ from: kit.defaultAccount })
    } catch (error) {
        notification(`⚠️ ${error}.`)
    }
    notification(`You successfully added "${_drug[0]}".`)
    getDrugs();
    document.getElementById("drugName").value = ""
    document.getElementById("drugImage").value = ""
    document.getElementById("drugDescription").value = ""
    document.getElementById("drugPrice").value = ""
})

// save user data on data submission
saveUserDataBtn.addEventListener("click", () => {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    if (name === "") {
        notification("Name can't be empty!");
    } else if (email === "") {
        notification("Email can't be empty!");
    } else {
        localStorage.setItem("name", name);
        localStorage.setItem("email", email);
        document.getElementById("logout").classList.add("d-flex")
        document.getElementById("dataCollection").remove()
        location.reload()
    }
})

// logout user
logout.addEventListener("click", () => {
    localStorage.clear()
    document.getElementById("logout").remove()
    location.reload()
})

// notification on
function notification(_text) {
    document.querySelector(".alert").style.display = "block"
    document.querySelector("#notification").textContent = _text
}

// notification off
function notificationOff() {
    document.querySelector(".alert").style.display = "none"
}

// on screen load
window.addEventListener("load", async () => {
    let slider = document.querySelector(".slide-in-down");
    if (slider.classList.contains("opened")) {
        slider.classList.remove("opened");
        slider.classList.add("closed");
    } else {
        slider.classList.remove("closed");
        slider.classList.add("opened");
    }
    if (localStorage.getItem("name") && localStorage.getItem("email")) {
        let dataCollection = document.getElementById("dataCollection");
        dataCollection.style.display = "none";
        dataCollection.remove()
        document.getElementById("username").innerText = `${localStorage.getItem("name")}`
        document.getElementById("modalUsername").innerText = `${localStorage.getItem("name")}`
        document.getElementById("modalEmail").innerHTML = `Email: <a href="mailto:${localStorage.getItem("email")}">${localStorage.getItem("email")}</a>`
    } else {
        document.getElementById("logout").classList.add("d-none")
    }
    notification("⌛ Loading...");
    await connectCeloWallet();
    await getBalance();
    await getDrugs();
    renderDrugs();
    await renderAddDrug();
    notificationOff();
});
