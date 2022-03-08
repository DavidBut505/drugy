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
        bool isSold;
        bool isReported;
    }

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
        uint256 _price
    ) public isAdmin {
        drugs[drugsLength] = Drug(
            payable(msg.sender),
            _name,
            _image,
            _description,
            _price,
            false,
            false
        );
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
            bool
        )
    {
        return (
            drugs[_index].owner,
            drugs[_index].name,
            drugs[_index].image,
            drugs[_index].description,
            drugs[_index].price,
            drugs[_index].isSold,
            drugs[_index].isReported
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
    function buyDrug(uint256 _index) public payable {
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                drugs[_index].owner,
                drugs[_index].price
            ),
            "Transfer failed."
        );
        drugs[_index].owner = payable(msg.sender);
        drugs[_index].isSold = true;
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

    // change drug ownership
    function changeDrugOwnership(
        uint256 _index,
        address currentOwner,
        address newOwner
    ) public {
        require(
            msg.sender == currentOwner,
            "You are not the owner! so you can't ownership."
        );
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                drugs[_index].owner,
                drugs[_index].price
            ),
            "Transaction could not be performed"
        );

        drugs[_index].owner = payable(newOwner);
    }

    // get total drug length
    function getDrugsLength() public view returns (uint256) {
        return (drugsLength);
    }
}
