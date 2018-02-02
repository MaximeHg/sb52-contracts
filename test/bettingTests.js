import EVMThrow from './helpers/EVMThrow';
import revert from './helpers/revert';

import latestTime from './helpers/latestTime';
import { increaseTimeTo, duration } from './helpers/increaseTime';

const Superbowl52 = artifacts.require("Superbowl52");
const BallotSB52 = artifacts.require("BallotSB52");
const should = require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('Superbowl52', function(accounts) {
  describe('Before game starts', () => {
    let Superbowl52Instance;
    // start and end timestamps where investments are allowed (both inclusive)
    let startTime = 1517787000;

    beforeEach(async () => {
      Superbowl52Instance = await Superbowl52.new({ from: accounts[0], gas:60000000});
    });

    // test will automatically fail after game time
    it("should be possible to bet before game time", async() => {
      await Superbowl52Instance.bet.sendTransaction(1, {from: accounts[1], value: "100"});
      let totalBets = await Superbowl52Instance.totalBets.call();
      assert.equal(totalBets, 100);
    });

    it("should be possible to bet for Philadelphia before game time", async() => {
      await Superbowl52Instance.bet.sendTransaction(1, {from: accounts[1], value: "100"});
      let userBets = await Superbowl52Instance.getPhiladelphiaBets.call(accounts[1]);
      assert.equal(userBets, 100);
    });

    it("should be possible to bet for New England before game time", async() => {
      await Superbowl52Instance.bet.sendTransaction(2, {from: accounts[1], value: "100"});
      let userBets = await Superbowl52Instance.getNewEnglandBets.call(accounts[1]);
      assert.equal(userBets, 100);
    });

    it("should be possible to bet for Philadelphia and New England before game time", async() => {
      await Superbowl52Instance.bet.sendTransaction(1, {from: accounts[1], value: "100"});
      await Superbowl52Instance.bet.sendTransaction(2, {from: accounts[1], value: "100"});
      let userBetsPHI = await Superbowl52Instance.getPhiladelphiaBets.call(accounts[1]);
      let userBetsNE = await Superbowl52Instance.getNewEnglandBets.call(accounts[1]);
      assert.equal(userBetsPHI, 100);
      assert.equal(userBetsNE, 100);
      let totalBets = await Superbowl52Instance.totalBets.call();
      assert.equal(totalBets, 200);
    });

    it("should not be possible to bet with a wrong team number", async() => {
      await Superbowl52Instance.bet.sendTransaction(3, {from: accounts[1], value: "100"}).should.be.rejectedWith(revert);
      let totalBets = await Superbowl52Instance.totalBets.call();
      assert.equal(totalBets, 0);
    });

    it("should be possible to bet twice", async() => {
      await Superbowl52Instance.bet.sendTransaction(1, {from: accounts[1], value: "100"});
      await Superbowl52Instance.bet.sendTransaction(1, {from: accounts[1], value: "100"});
      let totalBets = await Superbowl52Instance.totalBets.call();
      let userBetsPHI = await Superbowl52Instance.getPhiladelphiaBets.call(accounts[1]);
      assert.equal(userBetsPHI, 200);
      assert.equal(totalBets, 200);
    });

  });

  /*describe('After game starts: happy path', () =>  {
    let Superbowl52Instance;
    // start and end timestamps where investments are allowed (both inclusive)
    let startTime = 1517787000;
    let ballotInstance;

    before(async () => {
      Superbowl52Instance = await Superbowl52.new({ from: accounts[0], gas:60000000});
      await Superbowl52Instance.bet.sendTransaction(1, {from: accounts[1], value: "10000000000000000000000"});
      await Superbowl52Instance.bet.sendTransaction(2, {from: accounts[2], value: "10000000000000000000000"});
      await Superbowl52Instance.bet.sendTransaction(1, {from: accounts[3], value: "10000000000000000000000"});
      await Superbowl52Instance.bet.sendTransaction(2, {from: accounts[4], value: "10000000000000000000000"});
      await Superbowl52Instance.bet.sendTransaction(1, {from: accounts[5], value: "10000000000000000000000"});
      await Superbowl52Instance.bet.sendTransaction(1, {from: accounts[6], value: "10000000000000000000000"});
    });

    it("should not be possible to bet after game time", async() => {
      await increaseTimeTo(startTime + 1);
      await Superbowl52Instance.bet.sendTransaction(1, {from: accounts[1], value: "100"}).should.be.rejectedWith(revert);
    });

    it("should not be possible to set result before 8 hours passed since game time", async() => {
      await increaseTimeTo(startTime + duration.hours(7));
      await Superbowl52Instance.startVoting.sendTransaction({from: accounts[0]}).should.be.rejectedWith(revert);
    });

    it("should be possible to set result 8 hours after game time", async() => {
      await increaseTimeTo(startTime + duration.hours(8));
      await Superbowl52Instance.startVoting.sendTransaction({from: accounts[0]});
      let isVotingOpen = await Superbowl52Instance.votingOpen.call();
      assert.isTrue(isVotingOpen);
    });

    it("should be possible for anyone to vote", async() => {
      let ballot = await Superbowl52Instance.ballot.call();
      ballotInstance = BallotSB52.at(ballot);
      await ballotInstance.voteResult.sendTransaction(1, {from: accounts[1], value: "50000000000000000"});
      let phiVotes = await ballotInstance.phiWon.call();
      assert.equal(phiVotes, 1, "not enough philadelphia wins votes");
    });

    it("should be impossible for anyone to vote without or wrong value", async() => {
      await ballotInstance.voteResult.sendTransaction(1, {from: accounts[2], value: 0}).should.be.rejectedWith(revert);
      await ballotInstance.voteResult.sendTransaction(1, {from: accounts[3], value: "50000000000000001"}).should.be.rejectedWith(revert);
    });

    it("should be impossible for anyone to vote twice", async() => {
      await ballotInstance.voteResult.sendTransaction(1, {from: accounts[1], value: "50000000000000000"}).should.be.rejectedWith(revert);
      let phiVotes = await ballotInstance.phiWon.call();
      assert.equal(phiVotes, 1, "not enough philadelphia wins votes");
    });

    it("multiple votes : consensus reached", async() => {
      await ballotInstance.voteResult.sendTransaction(1, {from: accounts[0], value: "50000000000000000"});
      await ballotInstance.voteResult.sendTransaction(1, {from: accounts[2], value: "50000000000000000"});
      await ballotInstance.voteResult.sendTransaction(1, {from: accounts[3], value: "50000000000000000"});
      await ballotInstance.voteResult.sendTransaction(1, {from: accounts[4], value: "50000000000000000"});
      await ballotInstance.voteResult.sendTransaction(1, {from: accounts[5], value: "50000000000000000"});
      let phiVotes = await ballotInstance.phiWon.call();
      assert.equal(phiVotes, 6, "not enough philadelphia wins votes");
      let totalVotes = await ballotInstance.totalVoters.call();
      assert.equal(totalVotes, 6, "not enough votes");
    });

    it("shouldn't end votes if voting period is not finished", async() => {
      let result0 = await Superbowl52Instance.result.call();
      assert.equal(result0, 0, "no result should have been reached");
      await Superbowl52Instance.endVoting.sendTransaction({from:accounts[1]}).should.be.rejectedWith(revert);
      let withdrawalOpen = await Superbowl52Instance.withdrawalOpen.call();
      assert.isFalse(withdrawalOpen);
      let result = await Superbowl52Instance.result.call();
      assert.equal(result, 0, "no result should have been reached");
    });

    it("should end votes when voting period is finished", async() => {
      await increaseTimeTo(startTime + duration.hours(8) + duration.days(7)+100);
      let result0 = await Superbowl52Instance.result.call();
      assert.equal(result0, 0, "no result should have been reached");
      await Superbowl52Instance.endVoting.sendTransaction({from:accounts[1]});
      let withdrawalOpen = await Superbowl52Instance.withdrawalOpen.call();
      assert.isTrue(withdrawalOpen, "withdrawal should be open");
      let result = await Superbowl52Instance.result.call();
      assert.equal(result, 1, "result should have been reached");
    });

    it("should be possible to withdraw winnings", async() => {
      let balanceBefore = await web3.eth.getBalance(accounts[1]);
      await Superbowl52Instance.getWinnings.sendTransaction(0, {from:accounts[1]});
      let balanceAfter = await web3.eth.getBalance(accounts[1]);
      let hasClaimed = await Superbowl52Instance.hasClaimed(accounts[1]);
      assert.isTrue(hasClaimed);
      assert.isAbove(balanceAfter.toNumber(), balanceBefore.toNumber(), "should have won ether");
    });

    it("should not send anything to losers", async() => {
      let balanceBefore = await web3.eth.getBalance(accounts[2]);
      await Superbowl52Instance.getWinnings.sendTransaction(0, {from:accounts[2]});
      let balanceAfter = await web3.eth.getBalance(accounts[2]);
      let hasClaimed = await Superbowl52Instance.hasClaimed(accounts[2]);
      assert.isTrue(hasClaimed);
      let wins = await Superbowl52Instance.wins.call(accounts[2]);
      assert.equal(wins, 0, "should be equal to 0");
      assert.equal(balanceAfter.toNumber(), balanceBefore.toNumber(), "should have not won ether");
    });

    it("should not be possible to withdraw winnings twice", async() => {
      await Superbowl52Instance.getWinnings.sendTransaction(0, {from:accounts[1]}).should.be.rejectedWith(revert);
    });

    it("balance should be equal to 0 once everyone withdrew", async() => {
      await Superbowl52Instance.getWinnings.sendTransaction(0, {from:accounts[3]});
      await Superbowl52Instance.getWinnings.sendTransaction(0, {from:accounts[5]});
      await Superbowl52Instance.getWinnings.sendTransaction(0, {from:accounts[6]});
      let balanceContract = await web3.eth.getBalance(Superbowl52Instance.address);
      assert.equal(balanceContract.toNumber(), 0, "balance should be empty");
    });

    it("should be possible to withdraw ballot rewards", async() => {
      let balanceBefore = await web3.eth.getBalance(accounts[0]);
      await ballotInstance.getReward.sendTransaction(accounts[0]);
      let balanceAfter = await web3.eth.getBalance(accounts[0]);
      let hasClaimed = await ballotInstance.hasClaimed(accounts[0]);
      //let majorityReward = await ballotInstance.majorityReward.call();
      assert.isTrue(hasClaimed);
      assert.isAbove(balanceAfter.toNumber(), balanceBefore.toNumber(), "should have won ether");
    });

    it("should not be possible to withdraw ballot rewards twice", async() => {
      await ballotInstance.getReward.sendTransaction(accounts[0]).should.be.rejectedWith(revert);
    });

    it("balance should be equal at least < 10 once everyone got their rewards", async() => {
      await ballotInstance.getReward.sendTransaction(accounts[1]);
      await ballotInstance.getReward.sendTransaction(accounts[2]);
      await ballotInstance.getReward.sendTransaction(accounts[3]);
      await ballotInstance.getReward.sendTransaction(accounts[4]);
      await ballotInstance.getReward.sendTransaction(accounts[5]);

      let balanceContract = await web3.eth.getBalance(ballotInstance.address);
      assert.isAbove(10, balanceContract.toNumber(), "balance should be empty");
    });

  });*/

  describe('After game starts: consensus not reached on first try', () =>  {
    let Superbowl52Instance;
    // start and end timestamps where investments are allowed (both inclusive)
    let startTime = 1517787000;
    let ballotInstance;

    before(async () => {
      Superbowl52Instance = await Superbowl52.new({ from: accounts[0], gas:60000000});
      await Superbowl52Instance.bet.sendTransaction(1, {from: accounts[1], value: "10000000000000000000000"});
      await Superbowl52Instance.bet.sendTransaction(2, {from: accounts[2], value: "10000000000000000000000"});
      await Superbowl52Instance.bet.sendTransaction(1, {from: accounts[3], value: "10000000000000000000000"});
      await Superbowl52Instance.bet.sendTransaction(2, {from: accounts[4], value: "10000000000000000000000"});
      await Superbowl52Instance.bet.sendTransaction(1, {from: accounts[5], value: "10000000000000000000000"});
      await Superbowl52Instance.bet.sendTransaction(1, {from: accounts[6], value: "10000000000000000000000"});
    });

    it("should be possible to set result 8 hours after game time", async() => {
      await increaseTimeTo(startTime + duration.hours(8));
      await Superbowl52Instance.startVoting.sendTransaction({from: accounts[0]});
      let isVotingOpen = await Superbowl52Instance.votingOpen.call();
      assert.isTrue(isVotingOpen);
    });

    it("should be possible for anyone to vote", async() => {
      let ballot = await Superbowl52Instance.ballot.call();
      ballotInstance = BallotSB52.at(ballot);
      await ballotInstance.voteResult.sendTransaction(1, {from: accounts[1], value: "50000000000000000"});
      let phiVotes = await ballotInstance.phiWon.call();
      assert.equal(phiVotes, 1, "not enough philadelphia wins votes");
    });

    it("multiple votes : consensus not reached", async() => {
      await ballotInstance.voteResult.sendTransaction(1, {from: accounts[0], value: "50000000000000000"});
      await ballotInstance.voteResult.sendTransaction(1, {from: accounts[2], value: "50000000000000000"});
      await ballotInstance.voteResult.sendTransaction(2, {from: accounts[3], value: "50000000000000000"});
      await ballotInstance.voteResult.sendTransaction(2, {from: accounts[4], value: "50000000000000000"});
      await ballotInstance.voteResult.sendTransaction(1, {from: accounts[5], value: "50000000000000000"});
      let phiVotes = await ballotInstance.phiWon.call();
      assert.equal(phiVotes, 4, "not enough philadelphia wins votes");
      let totalVotes = await ballotInstance.totalVoters.call();
      assert.equal(totalVotes, 6, "not enough votes");
    });

    it("should end votes when voting period is finished but create a new ballot", async() => {
      let first_ballot = await Superbowl52Instance.ballot.call();
      await increaseTimeTo(startTime + duration.hours(8) + duration.days(7)+100);
      let result0 = await Superbowl52Instance.result.call();
      assert.equal(result0, 0, "no result should have been reached");
      await Superbowl52Instance.endVoting.sendTransaction({from:accounts[1]});
      let withdrawalOpen = await Superbowl52Instance.withdrawalOpen.call();
      assert.isFalse(withdrawalOpen, "withdrawal should be open");
      let result = await Superbowl52Instance.result.call();
      assert.equal(result, 0, "result should not have been reached");
      let new_ballot = await Superbowl52Instance.ballot.call();
      let ballots = new_ballot == first_ballot;
      assert.isFalse(ballots);
      ballotInstance = BallotSB52.at(new_ballot);
    });

    it("multiple votes : consensus reached at around 85%", async() => {
      await ballotInstance.voteResult.sendTransaction(1, {from: accounts[0], value: "50000000000000000"});
      await ballotInstance.voteResult.sendTransaction(1, {from: accounts[2], value: "50000000000000000"});
      await ballotInstance.voteResult.sendTransaction(1, {from: accounts[3], value: "50000000000000000"});
      await ballotInstance.voteResult.sendTransaction(1, {from: accounts[6], value: "50000000000000000"});
      await ballotInstance.voteResult.sendTransaction(1, {from: accounts[7], value: "50000000000000000"});
      await ballotInstance.voteResult.sendTransaction(2, {from: accounts[4], value: "50000000000000000"});
      await ballotInstance.voteResult.sendTransaction(1, {from: accounts[5], value: "50000000000000000"});
      let phiVotes = await ballotInstance.phiWon.call();
      assert.equal(phiVotes, 6, "not enough philadelphia wins votes");
      let totalVotes = await ballotInstance.totalVoters.call();
      assert.equal(totalVotes, 7, "not enough votes");
    });

    it("should end votes when voting period is finished", async() => {
      await increaseTimeTo(startTime + duration.hours(8) + duration.days(14)+200);
      let result0 = await Superbowl52Instance.result.call();
      assert.equal(result0, 0, "no result should have been reached");
      await Superbowl52Instance.endVoting.sendTransaction({from:accounts[1]});
      let withdrawalOpen = await Superbowl52Instance.withdrawalOpen.call();
      assert.isTrue(withdrawalOpen, "withdrawal should be open");
      let result = await Superbowl52Instance.result.call();
      assert.equal(result, 1, "result should have been reached");
    });

    it("should be possible to withdraw winnings", async() => {
      let balanceBefore = await web3.eth.getBalance(accounts[1]);
      await Superbowl52Instance.getWinnings.sendTransaction(0, {from:accounts[1]});
      let balanceAfter = await web3.eth.getBalance(accounts[1]);
      let hasClaimed = await Superbowl52Instance.hasClaimed(accounts[1]);
      assert.isTrue(hasClaimed);
      assert.isAbove(balanceAfter.toNumber(), balanceBefore.toNumber(), "should have won ether");
    });

    it("should not send anything to losers", async() => {
      let balanceBefore = await web3.eth.getBalance(accounts[2]);
      await Superbowl52Instance.getWinnings.sendTransaction(0, {from:accounts[2]});
      let balanceAfter = await web3.eth.getBalance(accounts[2]);
      let hasClaimed = await Superbowl52Instance.hasClaimed(accounts[2]);
      assert.isTrue(hasClaimed);
      let wins = await Superbowl52Instance.wins.call(accounts[2]);
      assert.equal(wins, 0, "should be equal to 0");
      assert.isAbove(balanceBefore.toNumber(), balanceAfter.toNumber(), "should have not won ether");
    });

    it("balance should be equal to 0 once everyone withdrew", async() => {
      let balanceOwner = await web3.eth.getBalance(accounts[0]);
      await Superbowl52Instance.getWinnings.sendTransaction(0, {from:accounts[3]});
      await Superbowl52Instance.getWinnings.sendTransaction(0, {from:accounts[5]});
      await Superbowl52Instance.getWinnings.sendTransaction(1, {from:accounts[6]});
      let balanceOwner2 = await web3.eth.getBalance(accounts[0]);
      let balanceContract = await web3.eth.getBalance(Superbowl52Instance.address);
      assert.isAbove(balanceOwner2.toNumber(), balanceOwner.toNumber(), "should have donations");
      assert.equal(balanceContract.toNumber(), 0, "balance should be empty");
    });

    it("should be possible to withdraw ballot rewards", async() => {
      let balanceBefore = await web3.eth.getBalance(accounts[0]);
      await ballotInstance.getReward.sendTransaction(accounts[0]);
      let balanceAfter = await web3.eth.getBalance(accounts[0]);
      let hasClaimed = await ballotInstance.hasClaimed(accounts[0]);
      //let majorityReward = await ballotInstance.majorityReward.call();
      assert.isTrue(hasClaimed);
      assert.isAbove(balanceAfter.toNumber(), balanceBefore.toNumber(), "should have won ether");
    });

    it("balance should be equal at least < 10 once everyone got their rewards", async() => {
      await ballotInstance.getReward.sendTransaction(accounts[2]);
      await ballotInstance.getReward.sendTransaction(accounts[3]);
      await ballotInstance.getReward.sendTransaction(accounts[4]);
      await ballotInstance.getReward.sendTransaction(accounts[5]);
      await ballotInstance.getReward.sendTransaction(accounts[6]);
      await ballotInstance.getReward.sendTransaction(accounts[7]);

      let balanceContract = await web3.eth.getBalance(ballotInstance.address);
      assert.isAbove(10, balanceContract.toNumber(), "balance should be empty");
    });

  });
});
