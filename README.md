# betacrew-exchange-client-assignment

## Setup Instructions

### Step-1: clone the repo
```
git clone https://github.com/Daanish2003/betacrew-exchange-client-assignment.git
cd betacrew-exchange-client-assignment
```

### Step-2: Run the BetaCrew Exchange Server
```
node main.js
```

### Step-3 Run the client solution
```
node client.js
```

### Step-4 Output
 -  then view the output.json for output

## Solution Approach

 - There is need for two function is to send the request and parse the request
 - And after parsing and iterating the loop in array find the missing sequences and store it in array
 - Then send the another single request to fetch the missing the stock exchange data
 - Then arrange the packets in order and write it into file in JSON format
 - Also it disconnects after second request
