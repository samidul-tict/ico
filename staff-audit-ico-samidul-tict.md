https://github.com/0xMacro/student.samidul-tict/tree/0d538d6e55052745da94df2f3ae7caa2dcabafb3/ico

Audited By: Gary 

# General Comments

Great work!  You fixed all the issues except for the one on the Phase transition.  In the attempt to
correct the issue, there still remains one edge case that would lead to a phase being skipped. See details below.
Basically, you should validate that the desired phase passed in as a parameter on the function call is the actual
next phase (from the current phase).  In addition, I flagged the `fallback` function as a technical error.  If for
some reason that the `fallback'`function is called, the address that called this function should not be added as
a contributor.   

I also added 3 additional quality issues regarding check on amt contributed, immutability and initializing storage variables. 

Thanks for the writeup in the readme for detailing the errors that you corrected.

Good luck! 

# Design Exercise

No Changes 

# Issues

**[L-1]** Dangerous Phase Transitions

If the 'changeICOStage' function is called twice with the same _desiredPhase in the parameter a phase can accidentally 
be skipped. There are a few situations where this might occur:

1. Front-end client code malfunction calling the function twice.
2. Human error double-clicking a button on the interface on accident.
3. Repeat invocations with intent - Uncertainty around whether or not a 
transaction went through, or having a delay before a transaction processes, 
are common occurrences on Ethereum today.

Ex.
```
Actual phase     _desiredPhase (parameter)    ->     New Phase

0 - Seed                2 - Open              -      1 - General   (Note: passed in incorrect next phase)
Then one of the 3 situations above occurs  
1 - General             2 - Open              ->     2 - Open      (Skipping General Phase) 
```

Consider checking that the desired phase is actually the next phase based on the current phase 
add:  require(uint8(currentPhase) == _desiredPhase - 1, "INVALID DESIRE PHASE"); 

**[Technical-error]**  Unnecessary `fallback)` function

Having a payable fallback function means your contract will accept ether if sent, but it doesn't need to do this. Having 
this function makes it possible for any address to mistakenly call this function (by calling a function that does not 
exist) and by sending no ETH, they will be added to the contributor list (totalInvestmentByUser) as 
it calls `_investInSPC()`, but without providing any funds.  See Q-1 issue below.  

Note:  Most likely, if this `fallback` function is called, the callee address does not want to contribute to the ICO

**[Q-1]**  Users can become contributors for free (+ gas)

There is no check that msg.value > 0 in the `_investInSPC()` function. This means users can get added to the contributors list (totalInvestmentByUser) without having contributed anything.

Consider checking to ensure users contribute a minimum amount of ETH to be added to the contributors mapping (totalInvestmentByUser). 

**[Q-2]** Use immutable variables

There are a number of variables set in the constructor on SpaceCoinICO.sol that don't change. (owner, treasury) These can be made immutable. See https://docs.soliditylang.org/en/v0.8.9/contracts.html#constant-and-immutable-state-variables

FYI

Unchanged variables should be marked constant or immutable

Contracts that includes storage variables that are not updated by any functions and do not change can save gas and improve readability by marking these variables as either constant or immutable.

What's the difference? In both cases, the variables cannot be modified after the contract has been constructed. For constant variables, the value has to be fixed at compile-time, while for immutable, it can still be assigned at construction time.

Compared to regular state variables, the gas costs of constant and immutable variables are much lower. For a constant variable, the expression assigned to it is copied to all the places where it is accessed and also re-evaluated each time. This allows for local optimizations. Immutable variables are evaluated once at construction time and their value is copied to all the places in the code where they are accessed. For these values, 32 bytes are reserved, even if they would fit in fewer bytes. Due to this, constant values can sometimes be cheaper than immutable values.

Consider marking unchanged storage variables after being updated in the constructor as immutable.

[Q-3] Needless setting of storage variables' initial values

This is not needed (and wastes gas) because every variable type has a default value it gets set to upon declaration.

For example:

address a;  // will be initialized to the 0 address (address(0))
uint256 b;  // will be initialized to 0
bool c;     // will be initialized to false
Consider not setting initial values for storage variables that would otherwise be equal to their default values.

In addition - no need to initialize currentPhase to Phase.SEED. in the constructor. It is already defaulted to that value.


# Score

| Reason | Score |
|-|-|
| Late                       | - |
| Unfinished features        | - |
| Extra features             | - |
| Vulnerability              | 1 |
| Unanswered design exercise | - |
| Insufficient tests         | - |
| Technical mistake          | 1 |

Total: 2

Great Job!


-------------------------------------------------------------------------------------------
## Previous Micro-audit 

https://github.com/0xMacro/student.samidul-tict/tree/625f41ee4d46b6c385f862be102492590396ff75/ico

Audited By: Cameron Voell

Reachable via discord: cyrcus#0533

# General Comments

Nice job on getting the main functionality implemented for the Space Coin ICO. The one main oversight was allowing `investInSPC` to be called externaly with arbitrary `_amount` value without actually sending in any ETH (See [H-1] below). Unfortunately, that bug combined with "Phase changes allowed to be initiated by non owner" would allow someone with many ETH address accounts to quickly pass through phase changes and claim SPC while only paying gas fees. There are also some issues around enforcing maximum total ETH contributions for each phase. My advice is to make sure you clarify the spec by asking questions and really question whether you are making assumptions that are not explicitly stated in the spec. Aside from [H-1] most of the issues seemed to arise from misinterpreting what the correct behavior should be as opposed to making mistakes in implementation. Nice job overriding transfer functions, implementing the tax, and enfocring seed round whitelist. 


# Design Exercise

Your second solution seems to achieve a large part of the vesting functionality.  You mention, " User will be forced to withdraw the balance only at the end of their maturity period." However for tokens awarded "linearly" over time, you may consider thinking of a way where the user will continuously have more rewards available for withdrawal. For example, a 12 SPC reward with a 1 year vesting period could allow me to withdraw 1 SPC after the first month, or .5 SPC after half a month.  


# Issues

**[Technical mistake - 1]** Phase changes should only be initiated by owner

Your ICO contract contains logic for changing phases based 
on the amount contributed. However, this functionality is not specified 
in the spec, and instead the spec only says "the owner of the contract should 
have the ability to pause and resume fundraising at any time, as well as move 
a phase forwards (but not backwards) at will." This extra code increases the 
attack surface of the contract.

Consider only allowing phase changes through the owner's initiation.

---

**[H-1]** `investInSPC` is not `payable` and enables claiming SPC without actual ETH investment

```solidity
// invest ETH to get SPC token
    function investInSPC(address _from, uint256 _amount) public {
        require(!pauseICO, "NOT_READY_FOR_SELL");
        
        uint256 _tokenRewarded = 0;
        totalInvestmentByUser[_from] += _amount;
        totalContribution += _amount;
```

Because `investInSPC` is declared as `public` it is callable by any external account. Since the funciton uses a passed in `_amount` variable instead of `msg.value`, a user could pass in any `_amount` and have tokens awarded to the address they specify. 

Consider making `investInSPC`  `payable` and using `msg.value` instead of passing in an `_amount` variable.

---

**[H-2]** `totalContribution` maximums are not enforced.

SpaceCoinICO.sol line 119:

```solidity
if(currentPhase == Phase.SEED) {
            require(isSenderWhitelisted(_from), "NOT_WHITELISTED");
            require(totalInvestmentByUser[_from] <= INDIV_SEED_LIMIT, "SEED_CAP_REACHED");
            if(totalContribution >= SEED_GOAL) {
                goToNextStage();
            }
        } else if(currentPhase == Phase.GENERAL) {
            require(totalInvestmentByUser[_from] <= INDIV_GENERAL_LIMIT, "GENERAL_CAP_REACHED");
            if(totalContribution >= GOAL) {
                goToNextStage();
            }
        } else {
            _tokenRewarded = claimToken(msg.sender);
```

The contract actually should not allow more than 30_000 ETH contributed (which means ICO will owe 150_000 SPC), but this is not enforced anywhere. This means that the ICO can go on forever, even after the contributions are worth more than the total available SPC. In addition, contributions that push the total over the SEED limit, do not get reverted as expected, instead, they are allowed, and will update the ICO phase. 

Consider reverting contributions if they push the ICO above the total for SEED round, or above the max 30_000 ETH limit. 

---

**[L-1]** Iteration through an unbounded array

```solidity
// function to check the whitelisted individual
    function isSenderWhitelisted(address _investor) public view returns(bool _found) {
        _found = false;
        uint256 i = 0;
        uint256 len = seedWhitelist.length;

        for( ; i < len; ) {
            if(_investor == seedWhitelist[i]) {
                _found = true;
                break;
            }
            ++i;
        }
        return _found;
    }
```

in `isSenderWhitelisted` you check if the user is on the allowlist by iterating through an array holding all the allow members. If the length of the array is small (e.g. < 15) this is no problem, but as the array grows it will become more costly.

More importantly, if the array size grows too large, such that it requires more than the block gas limit, then any functions that call `isSenderWhitelisted` will revert, which could cause your protocol to be unusable.

Normally this would be a Medium Severity issue, because it has the potential to brick your entire protocol, but because this array's size is determined by a permissioned address, it is far less likely to occur.

Instead of the O(n) code above you could use a mapping for constant time lookups and much more succinct code:

```solidity
    mapping (address => bool) public seedWhitelist;
```

---

**[L-2]** Dangerous Phase Transitions

If the 'changeICOStage' function is called twice, a phase can accidentally 
be skipped. There are a few situations where this might occur:

1. Front-end client code malfunction calling the function twice.
2. Human error double-clicking a button on the interface on accident.
3. Repeat invocations with intent - Uncertainty around whether or not a 
transaction went through, or having a delay before a transaction processes, 
are common occurrences on Ethereum today.

Consider refactoring this function by adding an input parameter that 
specifies either the expected current phase, or the expected phase to 
transition to.

---

**[Q-1]** Transfer overrides could be combined

Rather than individually overriding the OZ `transfer` and `transferFrom` functions to collect tax, you could just override `_transfer` which they both call.

---

**[Q-3]** Consider using public or external variables instead of private with a getter

```solidity
bool private pauseICO = false;

...

function getICOStatus() public view returns(bool) {
        return pauseICO;
}

```

can be replaced with 

```solidity
    bool public pauseICO = false;
```

---

# Score

| Reason | Score |
|-|-|
| Late                       | - |
| Unfinished features        | - |
| Extra features             | - |
| Vulnerability              | 8 |
| Unanswered design exercise | - |
| Insufficient tests         | - |
| Technical mistake          | 1 |

Total: 9

Good effort!
