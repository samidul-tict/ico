//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SpaceCoinICO is ERC20 {
    uint constant private MAX_SUPPLY = 500000;
    uint constant private SEED_TOTAL_LIMIT = 15000 ether;
    uint constant private SEED_INDIVIDUAL_LIMIT = 1500 ether;
    uint constant private GENERAL_INDIVIDUAL_LIMIT = 1000 ether;
    uint constant private GENERAL_TOTAL_LIMIT = 30000 ether;
    uint constant private TAX_RATE_PERCENT = 2;

    address private owner;
    address private treasury;
    address[] public seedWhitelist;
    bool public isPaused = false;
    bool public taxEnabled = false;
    
    enum Phase {SEED, GENERAL, OPEN}
    Phase public currentPhase;

    uint public totalContributions;
    uint public currentFunds;

    mapping (address => uint) public contributions;
    address[] public contributors;

    modifier onlyOwner {
        require (msg.sender == owner, "not owner");
        _;
    }

    constructor(address _treasury, address[] memory _seedWhitelist) ERC20 ("Space Coin", "SPX") {
        owner = msg.sender;
        treasury = _treasury;
        seedWhitelist = _seedWhitelist;
        currentPhase = Phase.SEED;
        totalContributions = 0;
    }

    function advancePhase() external onlyOwner {
        if (currentPhase == Phase.SEED) {
            currentPhase = Phase.GENERAL;
        }
        else if (currentPhase == Phase.GENERAL) {
            currentPhase = Phase.OPEN;
            _mintICOCoins();
        }
        else {
            return;
        }
    }

    function pause() external onlyOwner {
        isPaused = true;
    }

    function resume() external onlyOwner {
        isPaused = false;
    }

    function setTaxEnabled(bool _taxEnabled) external onlyOwner {
        taxEnabled = _taxEnabled;
    }

    function withdrawFunds(uint256 amount) external onlyOwner() {
        require(amount <= currentFunds, "not enough funds");
        require(currentPhase == Phase.OPEN, "not Open Phase");
        currentFunds -= amount;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    } 

    function contribute() external payable {
        require(isPaused == false, "fundraising paused");
        if (currentPhase == Phase.SEED) {
            require(_checkWhitelist(msg.sender), "not in seed whitelist");
            require(contributions[msg.sender] + msg.value < SEED_INDIVIDUAL_LIMIT, "reached individual limit");
            require(totalContributions + msg.value < SEED_TOTAL_LIMIT, "reached phase limit");
            _trackContribution(msg.sender, msg.value);
        }
        else if (currentPhase == Phase.GENERAL) {
            require(contributions[msg.sender] + msg.value < GENERAL_INDIVIDUAL_LIMIT, "reached individual limit");
            require(totalContributions + msg.value < GENERAL_TOTAL_LIMIT, "reached phase limit");
            _trackContribution(msg.sender, msg.value);

        }
        else if (currentPhase == Phase.OPEN) {
            require(totalSupply() + msg.value * 5 / 1e18 < MAX_SUPPLY, "max supply reached");
            _trackContribution(msg.sender, msg.value);
            _mint(msg.sender, msg.value * 5 / 1e18);
        }
    }

    function _trackContribution(address sender, uint amount) private {
        if (contributions[sender] == 0) {
                contributors.push(sender);
        }
        contributions[sender] += amount;
        totalContributions += amount;
        currentFunds += amount;
    }

    function _checkWhitelist(address toCheck) internal view returns (bool) {
        bool found = false;
        for (uint i=0; i<seedWhitelist.length; i++) {
            if (seedWhitelist[i] == toCheck) {
                found = true;
                break;
            }
        }
        return found;
    }

    function _mintICOCoins() private {
        for (uint i = 0; i<contributors.length; i++) {
            address contributor = contributors[i];
            _mint(contributor, contributions[contributor] * 5 / 1e18);
        }
    }

    function _transfer( address from, address to, uint256 amount) internal override {
        if (taxEnabled) {
            require(balanceOf(from) >= amount, "transfer amount exceeds balance");
            super._transfer(from, treasury, amount * 2 / 100);
            super._transfer(from, to, amount * 98 / 100);
        }
        else {
            super._transfer(from, to, amount);
        }
    }
    
A
A
A
A
A
A
A
A
A
A
A
A
A
A
A
A
A
A
A
A
A
A
A
A
A
A
A
B
B
B
}
