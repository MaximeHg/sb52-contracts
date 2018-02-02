pragma solidity ^0.4.18;

import "./SafeMath.sol";
import "./Superbowl52.sol";

// Contract written by MaximeHg
// https://github.com/MaximeHg/sb52-contracts
// Special thanks to moodysalem and its ethersquares contracts for the inspiration!
// https://github.com/ethersquares/ethersquares-contracts

contract BallotSB52 {
  using SafeMath for uint;
  uint public phiWon;
  uint public neWon;
  Superbowl52 bettingContract;
  mapping (address => bool) voted;
  mapping (address => uint) votes;
  uint public constant votingPeriod = 7 days;
  uint public votingStart;
  uint public votingEnd;
  uint public validResult;
  bool public closed;
  uint public totalVoters;
  // XX.XXX%
  uint public threshold;
  uint public votingReward;
  mapping (address => uint) stake;
  uint public majorityReward;
  bool public tie;
  mapping (address => bool) claimed;

  function BallotSB52(uint th) public payable {
    validResult = 0;
    closed = false;
    votingStart = now;
    votingEnd = now + 7 days;
    bettingContract = Superbowl52(msg.sender);
    totalVoters = 0;
    threshold = th;
    tie = false;
    votingReward = 0;
  }

  // you can only vote once
  function voteResult(uint team) public payable {
    require(votingStart <= now && votingEnd >= now);
    require(voted[msg.sender] == false);
    require(msg.value == 50 finney);
    require(!closed);
    if(team == 1) {
      phiWon += 1;
    }
    else if (team == 2) {
      neWon += 1;
    } else revert();
    voted[msg.sender] = true;
    votes[msg.sender] = team;
    totalVoters += 1;
    stake[msg.sender] = msg.value;
  }

  function closeBallot() public returns (uint) {
    require(!closed);
    require(now > votingEnd);
    if((phiWon.mul(100000).div(totalVoters) == neWon.mul(100000).div(totalVoters)) && (threshold == 50000)) {
      validResult = 9;
      closed = true;
      tie = true;
      return validResult;
    } else if(phiWon.mul(100000).div(totalVoters) >= threshold) {
      validResult = 1;
      votingReward = bettingContract.getLosersOnePercent(2);
      majorityReward = (neWon * 50 finney).add(votingReward).div(phiWon);
    } else if (neWon.mul(100000).div(totalVoters) >= threshold) {
      validResult = 2;
      votingReward = bettingContract.getLosersOnePercent(3);
      majorityReward = (phiWon * 50 finney).add(votingReward).div(neWon);
    } else {
      if (neWon.mul(100000).div(totalVoters) > 50000) majorityReward = (phiWon * 50 finney).div(neWon);
      else if (phiWon.mul(100000).div(totalVoters) > 50000) majorityReward = (neWon * 50 finney).div(phiWon);
      else {
        tie = true;
        majorityReward = 0;
      }
      validResult = 0;
    }
    closed = true;
    return validResult;
  }

  // anyone can claim reward for a voter
  function getReward(address voter) public {
    require(closed);
    require(voted[voter]);
    require(claimed[voter] == false);
    if(tie) {
      voter.transfer(stake[voter]);
    }
    // majority gets rewarded
    if(votes[voter] == validResult) {
      voter.transfer(stake[voter] + majorityReward);
    } // minority loses all
    claimed[voter] = true;
  }

  function hasClaimed(address voter) public constant returns (bool) {
    return claimed[voter];
  }

  function () public payable {}
}
