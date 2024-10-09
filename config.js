
import { stringToPath } from '@cosmjs/crypto'

export default {
    port: 5174, // http port
    db: {
        path: "./db/faucet.db" // save request states
    },
    project: {
        name: "Prysm Devnet",
        logo: "https://kleomed.es/logo/prysm.png",
        deployer: `<a href="https://kleomed.es">Kleomedes</a>`
    },
    blockchain: {
        // make sure that CORS is enabled in rpc section in config.toml
        // cors_allowed_origins = ["*"]
        rpc_endpoint: "https://prysm-rpc-devnet.kleomedes.network",

    },
    sender: {
        mnemonic: "",
        option: {
            hdPaths: [stringToPath("m/44'/118'/0'/0/0")],
            prefix: "prysm"
        }
    },
    tx: {
        amount: {
            denom: "uprysm",
            amount: "2000000"
        },
        fee: {
            amount: [
                {
                    amount: "500",
                    denom: "uprysm"
                }
            ],
            gas: "200000"
        },
    },
    limit: {
        // how many times each wallet address is allowed in a window(24h)
        address: 1,
        // how many times each ip is allowed in a window(24h),
        // if you use proxy, double check if the req.ip is return client's ip.
        ip: 1
    }
}
