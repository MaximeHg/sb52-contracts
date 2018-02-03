# sb52-contracts

This repository contains contracts that will secure bets on the Superbowl 52 outcome.

## How to bet

To bet for your favorite, interact with the deployed contract by sending value to the bet function
and passing in parameter 1 for Philadelphia or 2 for New England. <br>

Contract has been deployed [here](https://etherscan.io/address/0xa4ec44afee34feffbae5ce4218d3c06ebd70455e), can be accessed through [Pragma](https://etherscan.io/address/0xa4ec44afee34feffbae5ce4218d3c06ebd70455e) or through a [webapp](https://ethereum-sb52.herokuapp.com/) I've developped. Please note that you need Metamask installed for it to work. <br>

## Workflow of the contract

### Betting phase

Once deployed, the betting phase opens. Everybody can send their bets, multiple times. Everyone can vote multiple times and can vote for both teams. Every bet is final and cannot be cancelled.

Once clocks strikes 6:30pm on game day, betting stops. 8 hours after game time, anyone can trigger the voting phase by calling the startVoting function. This will create a ballot (aka an oracle) and open the voting phase.

### Voting phase

Anyone can vote by interacting with the ballot smart contract and send the result by calling the voteResult function and pass in its parameter 1 for a Philadelphia win or 2 for a New England win. <br> Anyone that wants to vote needs to send 0.05 ether that will be kept until the result is confirmed. If the result sent by the voter is the result chosen by the majority of voters, its stake is sent back with a reward of a part of 1% of betting gains and a part of the minority stakes (the ones who sent the wrong result). <br>

For the result to be confirmed, a majority of 90% of voters needs to be reached. If it's not reached on the first ballot, the threshold decreases of 5% each time a new ballot is created. Then, if a 85% majority is not reached on the second ballot, a third one is created requiring a 80% majority. This process goes on until a simple majority is reached. <br>

Once a ballot gets the majority required, the voting phase ends and the withdrawal phase begins.

### Withdrawal phase

Since the result has been confirmed by the oracle, withdrawals can now be made. Winners can call the getWinnings function of the betting contract with an optional (can be 0) donation percentage (in order to pay me a beer) in parameters. They will then receive their part of the winning pot! This phase never ends as it is the final state of the contract.

## Misc

### Tie in the final ballot

If the final ballot (requiring only 50%+1 majority) ends up in a tie, I will break the tie (and send the correct result). That would mean that all the previous ballots (8) ended in a not sufficient majority and the final one in a perfect tie. The probability of that happening is pretty low I guess. I believe we will reach a majority in the first ballots!

### Licensing

Please use these contracts as much as you want, fork them, send pull requests... Every relevant comment is welcome! Don't forget to mention me if you publish a (potentially modified) copy!
