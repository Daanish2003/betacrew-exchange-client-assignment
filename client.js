const net = require('net')
const fs = require('fs')

const HOST = '127.0.0.1';
const PORT = 3000;

const PACKET_SIZE = 17;

function parsePacket(buffer) {
    const symbol = buffer.subarray(0, 4).toString('ascii');
    const side = buffer.subarray(4, 5).toString('ascii');
    const quantity = buffer.readInt32BE(5);
    const price = buffer.readInt32BE(9);
    const sequence = buffer.readInt32BE(13);

    return { symbol, side, quantity, price, sequence };
}

function sendRequest(callType, resendSeq = 0) {
    const client = new net.Socket();
    return new Promise((resolve, reject) => {
        let dataBuffer = Buffer.alloc(0);
        const results = [];

        client.connect(PORT, HOST, () => {
            const payload = Buffer.alloc(2);
            payload.writeUint8(callType, 0);
            payload.writeUint8(resendSeq, 1)
            client.write(payload);
        })

        client.on('data', (chunk) => {
            dataBuffer = Buffer.concat([dataBuffer, chunk]);
            while (dataBuffer.length >= PACKET_SIZE) {
                const packet = dataBuffer.subarray(0, PACKET_SIZE);
                const parsed = parsePacket(packet)
                results.push(parsed);
                dataBuffer = dataBuffer.subarray(PACKET_SIZE);
            }
        });

        client.on('end', () => {
            resolve(results);
        })

        client.on('error', (err) => {
            reject(err);
        });

        if (callType === 2) {
            client.on('data', () => {
              client.end();
            });
        }
    })
}

async function main() {
    const allPackets = await sendRequest(1);
    const seenSequences = new Set();
    const maxSequence = Math.max(...allPackets.map(p => p.sequence));
    allPackets.forEach(p => seenSequences.add(p.sequence))

    const missing = [];
    for (let i = 1; i < maxSequence; i++) {
        if (!seenSequences.has(i)) {
          missing.push(i);
        }
    }


    const recoveredPackets = [];
    for (const seq of missing) {
        try {
            const [patch] = await sendRequest(2, seq);
            recoveredPackets.push(patch)
        } catch (err) {
            console.error(`Failed to fetch sequence ${seq}:`, err);
        }
    }

    const finalPackets = [...allPackets, ...recoveredPackets];

    finalPackets.sort((a, b) => a.sequence - b.sequence);

    fs.writeFileSync('output.json', JSON.stringify(finalPackets, null, 2));
    console.log(`✅ Done! ${finalPackets.length} packets written to output.json`);
}

main().catch(console.error);