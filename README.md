-------------------------------------- Design Question -------------------------------------
The base requirements give contributors their SPC tokens immediately. How would you design your contract to vest the awarded tokens instead, i.e. award tokens to users over time, linearly?

We can achieve this in two different ways:

1. user can withdraw their token after a certain date-time and this date will be set at contract level. If we go with this approach [not recommended though] then we can use a map-value i.e. pendingWithdrawals [ address => tokenlist[] ] to store the list of tokens. We need to implement a method to provide the functionality to withdraw the amount either in part or in full after the defined date-time. We can also extend the current transferToken() function to provide the flexibity to transfer the token in part/ full.

Pros: easy to implement
cons: 1. This option doesn't support pure linear withdrawal approach.
      2. User might not be interested to buy the token in the beginning as the vesting period will be longer. So, ICO process might fail.

2. recommended: We can vest the balance for a given term [2/3/4 years] based on the transaction date. User will be forced to withdraw the balance only at the end of their maturity period. This can be achieved using a map-value pair (address => struct[]). The structure will contain the transaction amount and the date-time of the transaction for a given buyer, so that system can calculate the maturity based on the transaction date and release the fund when applicable. We can extend the current transferToken() function or implement a new one to provide partial withdrawal functionality.

pros: Every buyer can be treated equally, so they might be interested to invest at the early stage of the ICO.
cons: 1. this is a complex solution as compare to option-1.
      2. Need to maintain a lot of data on chain which will increase the cost.

------------------------------------- Errors Corrected --------------------------------------
1. **[H-1]** `investInSPC` is not `payable` and enables claiming SPC without actual ETH investment. Please refer line number 128 in SpaceCoinICO.sol for the fix.
2. **[H-2]** `totalContribution` maximums are not enforced. Please refer _investInSPC() function in SpaceCoinICO.sol for the fix.
3. **[L-1]** Iteration through an unbounded array. Replaced the previous implementation completely. Currently using a mapping [i.e. seedWhitelist] instead of an array.
4. **[L-2]** Dangerous Phase Transitions. Removed the automatic phase transition and updated the function: changeICOStage() to handle the mentioned edge cases in the audit report.
5. **[Q-1]** Transfer overrides could be combined. Replaced transfer() & safeTransferFrom() functions using _transfer() only.
6. **[Q-3]** Consider using public or external variables instead of private with a getter. Removed the unnecessary getter methods.

------------------------------------- Few Points --------------------------------------
1. I have added one extra field in the UI [i.e. Total contribution to ICO] to validate the contribute function.
2. Buy SPC function will always send 0.001 ether. It is hardcoded in the index.js
3. "Transfer token" button was added to capture the error messages due to REQUIRE statement.
4. I have set owner = treasury = whitelisted address for my own convenience to deposit during SEED phase or transfer the token etc.
5. We may need to uncomment line number: 28 which is "defaultNetwork: 'rinkeby' " in "hardhat.config.ts" file if need to re-deploy in testnet.
6. Contract deployed to testnet is slightly different than the one in Git repo. This is because I deployed to testnet earlier and then did some minor improvement after Wednesday class. Like release of token using push mechanism instead of pull. Also, there is no change to UI related functionalities.

--------------------------------------- Contract URLs ------------------------------------
https://rinkeby.etherscan.io/tx/0x775a666e29c83ef2b6f84f3f1e65560e649ae77719d781eada8488d15382f0f4
https://rinkeby.etherscan.io/address/0xebfe5f5f6c02de8df3de0e2a018b89576459f8b0