//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

//import "hardhat/console.sol";
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

    // store the total contribution of each person
    mapping (address => uint256) totalInvestmentByUser;

    event ChangeICOStage(address indexed _owner, Phase indexed _currentPhase);
    event ToggleTaxFlag(address indexed _owner, bool indexed _canDeductTax);
    event ToggleICOStatus(address indexed _owner, bool indexed _canDeductTax);
    event Transferred(address indexed _sender, address indexed _receiver, uint256 indexed _token);
    event InvestedInSPC(address indexed _investor, uint256 indexed _amount);

    constructor(address payable _treasury, uint256 _startingPrice, address[] memory _seedWhitelist) ERC20("Space Coin", "SPC") {
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

    // function to change ICO phase by owner only
    function changeICOStage() external onlyOwner() {
        goToNextStage();
        emit ChangeICOStage(msg.sender, currentPhase);
    }

    // function to change ICO phase automatically by internal method only, no user
    function goToNextStage() internal {
        if(currentPhase == Phase.SEED) {
            currentPhase = Phase.GENERAL;
            //console.log("GENERAL PHASE");
        } else if(currentPhase == Phase.GENERAL) {
            currentPhase = Phase.OPEN;
            coinPrice = SPX_PRICE_OPEN;
            //console.log("OPEN PHASE");
        } else {
            // do nothing
        }
    }

    // toggle TAX deduction flag
    function toggleTaxFlag() external onlyOwner() {
        canDeductTax = !canDeductTax;
        emit ToggleTaxFlag(msg.sender, canDeductTax);
    }

    // hold or resume ICO
    function toggleICOStatus() external onlyOwner() {
        resumeICO = !resumeICO;
        emit ToggleICOStatus(msg.sender, resumeICO);
    }

    // transfer SPC to user/ contract
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
    
    // invest ETH to get SPC token
    function investInSPC() public payable {
        require(resumeICO, "not ready for sell");

        uint256 tokenCount = msg.value / coinPrice;
        uint256 potentialInvestment = totalInvestmentByUser[msg.sender] + msg.value;
        if(currentPhase == Phase.OPEN) {
            totalInvestmentByUser[msg.sender] = potentialInvestment;
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
                require(potentialInvestment <= INDIV_LIMIT_SEED, "not eligible");
                totalInvestmentByUser[msg.sender] = potentialInvestment;
                totalContribution += msg.value;
                if(totalContribution >= SEED_GOAL) {
                    goToNextStage();
                }
            } else {
                require(potentialInvestment <= INDIV_LIMIT_GENERAL, "not eligible");
                totalInvestmentByUser[msg.sender] = potentialInvestment;
                totalContribution += msg.value;
                if(totalContribution >= GOAL) {
                    goToNextStage();
                }
            }
        }
        _transfer(treasury, msg.sender, tokenCount);
        emit InvestedInSPC(msg.sender, msg.value);
    }

    receive() external payable {
        investInSPC();
    }
}