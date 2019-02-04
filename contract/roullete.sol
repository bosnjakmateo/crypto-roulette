pragma solidity ^0.5.0;

contract roullete {
    // Stanje tokena po racunima
    mapping(address => uint256) ledger;
    
    // Popis adresa koje su ulozile
    address[] investedAddresses;
    
    // Adrese koje su ulozile i ulozeni iznos
    mapping(address => uint256) poolInvested;
    
    // Ukupna ulozena vrijednost u trenutnom kolu
    uint256 poolValue = 0;
    
    // Za rng
    uint nonce;
    
    address payable owner;
    
    constructor() public{
        owner = msg.sender;
    }

    function investInPool(uint256 amount) public {
        require(ledger[msg.sender] >= amount, "Not enough funds");
        require(amount > 0, "Can't invest less then 1 RT");
        
        ledger[msg.sender] -= amount;
        poolInvested[msg.sender] += amount;
        poolValue += amount;
        investedAddresses.push(msg.sender);
    }
    
    function poolPay() public returns(address){
        require(msg.sender == owner, "Only owner can initiate poolPay");
        
        uint256 ticket = random();
        uint256 tickets = 0;
        address _address;
        
        for(uint i = 0; i < investedAddresses.length; i++){
            tickets += poolInvested[investedAddresses[i]];
            
            if(ticket <= tickets){
                _address = investedAddresses[i];
                break;
            }
        }
        
        ledger[_address] += poolValue;
        poolValue = 0;
        
        for(uint i = 0; i < investedAddresses.length; i++){
            poolInvested[investedAddresses[i]] = 0;
        }
        
        delete investedAddresses;
        
        return _address;
    }
    
    function random() internal returns (uint256) {
        uint256 randomnumber = uint256(keccak256(abi.encodePacked(now, nonce))) % poolValue;
        nonce++;
        return randomnumber;
    }
    
    // Razmjena RT za ETH
    function sellTokens(uint256 amount) public {
        require(ledger[msg.sender] >= amount, "Not enough funds");
        
        ledger[msg.sender] -= amount;
        
        msg.sender.transfer((amount * 1 finney) - 100 finney);
    }
    
    // Razmjena ETH za RT
    function buyTokens() public payable {
        ledger[msg.sender] += msg.value / 1 ether * 1000;
    }
    
    
    // Koliko ima posiljaoc
    function balanceOfSender() public view returns (uint256 balance) {
        return ledger[msg.sender];
    }
    
    // Koliko ima pool
    function balanceOfPool() public view returns (uint256) {
        return poolValue;
    }
    
    function destory() public {
        require(msg.sender == owner, "You are not the owner!");
        selfdestruct(owner);
    }
}