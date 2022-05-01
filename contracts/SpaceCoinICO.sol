//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SpaceCoinICO is ERC20 {

    enum Phase {SEED, GENERAL, OPEN}
    uint256 constant private MAX_SUPPLY = 500000;
    uint256 constant private GOAL = 30000 ether;
    uint256 constant private SEED_GOAL = 15000 ether;
    uint256 constant private INDIV_LIMIT_SEED = 1500 ether;
    uint256 constant private INDIV_LIMIT_GENERAL = 1000 ether;
    uint256 constant private SPX_PRICE_OPEN = 0.2 ether;
    uint8 constant private TAX_RATE_PERCENT = 2;

    address private owner;
    address payable private treasury;
    bool private canDeductTax;
    bool private resumeICO;
    uint256 private coinPrice;
    uint256 private totalContribution;
    Phase private currentPhase;
    address[] private seedWhitelist;

    mapping (address => uint256) totalInvestmentByUser;

    event ChangeICOStage(address indexed _owner, Phase indexed _currentPhase);
    event ToggleTaxFlag(address indexed _owner, bool indexed _canDeductTax);
    event ToggleICOStatus(address indexed _owner, bool indexed _canDeductTax);
    event Transferred(address indexed _sender, address indexed _receiver, uint256 indexed _token);
    event InvestedInSPX(address indexed _investor, uint256 indexed _amount);

    constructor(address payable _treasury, uint256 _startingPrice, address[] memory _seedWhitelist) ERC20("Space Coin", "SPX") {
        owner = msg.sender;
        treasury = _treasury;
        coinPrice = _startingPrice;
        currentPhase = Phase.SEED;
        resumeICO = true;
        seedWhitelist = _seedWhitelist;
        _mint(_treasury, MAX_SUPPLY);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not a valid owner");
        _;
    }

    function changeICOStage() external onlyOwner() {
        goToNextStage();
        emit ChangeICOStage(msg.sender, currentPhase);
    }

    function goToNextStage() internal {
        if(currentPhase == Phase.SEED) {
            currentPhase = Phase.GENERAL;
        } else if(currentPhase == Phase.GENERAL) {
            currentPhase = Phase.OPEN;
            coinPrice = SPX_PRICE_OPEN;
        } else {
            // do nothing
        }
    }

    function toggleTaxFlag() external onlyOwner() {
        canDeductTax = !canDeductTax;
        emit ToggleTaxFlag(msg.sender, canDeductTax);
    }

    function toggleICOStatus() external onlyOwner() {
        resumeICO = !resumeICO;
        emit ToggleICOStatus(msg.sender, resumeICO);
    }

    function transfer(address _to, uint256 _amount) public virtual override returns(bool) {

        require(currentPhase == Phase.OPEN, "token cannot be transferred");
        require(balanceOf(msg.sender) >= _amount, "not enough balance");

        if(canDeductTax) {
            uint256 netTax = (_amount * TAX_RATE_PERCENT) / 100;
            _amount -= netTax;
            _transfer(msg.sender, treasury, netTax);
        }
        _transfer(msg.sender, _to, _amount);
        emit Transferred(msg.sender, _to, _amount);
        return true;
    }
    
    function investInSPX() public payable {
        require(resumeICO, "not ready for sell");

        uint256 tokenCount = msg.value / coinPrice;
        if(currentPhase == Phase.OPEN) {
            totalInvestmentByUser[msg.sender] += msg.value;
            totalContribution += msg.value;
        } else {
            bool flag = false;
            uint256 i = 0;
            uint256 len = seedWhitelist.length;

            for( ; i < len; ) {
                if(msg.sender == seedWhitelist[i]) {
                    flag = true;
                    break;
                }
                ++i;
            }

            require(flag, "not a whitelisted contributor");
            if(currentPhase == Phase.SEED) {
                require(totalInvestmentByUser[msg.sender] <= INDIV_LIMIT_SEED, "not eligible");
                totalInvestmentByUser[msg.sender] += msg.value;
                totalContribution += msg.value;
                if(totalContribution >= SEED_GOAL) {
                    goToNextStage();
                }
            } else {
                require(totalInvestmentByUser[msg.sender] <= INDIV_LIMIT_GENERAL, "not eligible");
                totalInvestmentByUser[msg.sender] += msg.value;
                totalContribution += msg.value;
                if(totalContribution >= GOAL) {
                    goToNextStage();
                }
            }
            _transfer(treasury, msg.sender, tokenCount);
            emit InvestedInSPX(msg.sender, msg.value);
        }
    }

    receive() external payable {
        investInSPX();
    }

    fallback() external {
        investInSPX();
    }
}