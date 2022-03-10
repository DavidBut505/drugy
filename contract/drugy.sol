// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
    function transfer(address, uint256) external returns (bool);

    function approve(address, uint256) external returns (bool);

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address) external view returns (uint256);

    function allowance(address, address) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract DrugyMarketplace {
    // drug struct
    struct Drug {
        address payable owner;
        string name;
        string image;
        string description;
        uint256 price;
        bool isReported;
        uint256 quantity; // added a quantity
    }

    // events will be triggered when the specific function is executed.
    // This will provide better logs of function calls and transactions.
    event DrugListed(address indexed admin, uint256 drug_index, string name, uint256 quantity);
    event DrugBought(address indexed owner, address buyer, uint256 drug_index, string name, uint256 quantity);
    event DrugOutofStock(address indexed owner, string name);
    event ChangeDrugOwnership(address indexed previous_owner, address newOwner, string name);
    event ChangeStoreOwner(address indexed owner, address newOwner);

    // length of drugs
    uint256 internal drugsLength = 0;
    // cUSD address
    address internal cUsdTokenAddress =
        0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    // admin address
    address internal adminAddress = 0x8E7E27c2E55d94283Cb066Fd74Abc2D882365AEb;

    // check if admin
    modifier isAdmin() {
        require(msg.sender == adminAddress, "Only the admin can access this");
        _;
    }

    // mapping the Drug struct internally
    mapping(uint256 => Drug) internal drugs;

    // add drug from struct array
    function addDrug(
        string memory _name,
        string memory _image,
        string memory _description,
        uint256 _price,
        uint256 _quantity // added a quantity parameter
    ) public isAdmin {
        drugs[drugsLength] = Drug(
            payable(msg.sender),
            _name,
            _image,
            _description,
            _price,
            false,
            _quantity
        );
        emit DrugListed(msg.sender, drugsLength, _name, _quantity);
        drugsLength++;
    }

    // get drugs from struct array
    function getDrug(uint256 _index)
        public
        view
        returns (
            address payable,
            string memory,
            string memory,
            string memory,
            uint256,
            bool,
            uint256
        )
    {
        return (
            drugs[_index].owner,
            drugs[_index].name,
            drugs[_index].image,
            drugs[_index].description,
            drugs[_index].price,
            drugs[_index].isReported,
            drugs[_index].quantity
            );
    }

    // check if current user is admin
    function isUserAdmin(address _address) public view returns (bool) {
        if (_address == adminAddress) {
            return true;
        } else {
            return false;
        }
    }

    // buying drug
    function buyDrug(uint256 _index, uint256 _buyquantity) public payable {
        require(_buyquantity <= drugs[_index].quantity && drugs[_index].quantity > 0,
                "Not enough stock available"
        );
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                drugs[_index].owner,
                drugs[_index].price
            ),
            "Transfer failed."
        );
        drugs[_index].quantity = drugs[_index].quantity - _buyquantity;
        if (drugs[_index].quantity == 0)
            emit DrugOutofStock(drugs[_index].owner, drugs[_index].name);
        emit DrugBought(drugs[_index].owner, msg.sender, _index, drugs[_index].name, _buyquantity);
    }

    // report drug
    function reportDrug(uint256 _index) public payable {
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                drugs[_index].owner,
                drugs[_index].price
            ),
            "Transfer failed."
        );
        drugs[_index].isReported = true;
    }

    // changing the ownership of a specific drug
    // its like buying the rights of the drug. Not buying the physical drug. 
    // So no change in drug quantity
    function changeDrugOwnership(
        uint256 _index,
        address currentOwner,
        address newOwner
    ) public payable {
        require(
            msg.sender == currentOwner,
            "You are not the owner! so you can't ownership."
        );
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                newOwner,
                msg.sender,
                drugs[_index].price
            ),
            "Transaction could not be performed"
        );

        drugs[_index].owner = payable(newOwner);
        emit ChangeDrugOwnership(msg.sender, newOwner, drugs[_index].name);
    }

    // function to sell the whole drug store
    // This doesnot mean that every drug will be owned by the admin.
    function sellStore(uint256 storeAmount, address newStoreOwner) public payable isAdmin{
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                newStoreOwner,
                msg.sender,
                storeAmount
            ),
            "Transaction could not be performed"
        );
        adminAddress = newStoreOwner;
        emit ChangeStoreOwner(msg.sender, newStoreOwner);
    }

    // get total drug length
    function getDrugsLength() public view returns (uint256) {
        return (drugsLength);
    }
}