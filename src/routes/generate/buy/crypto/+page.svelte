<script>
  import { createAppKit } from '@reown/appkit'
  import { avalanche, avalancheFuji } from '@reown/appkit/networks'
  import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
  import { getAccount, createConfig, http, writeContract, watchAccount } from "@wagmi/core"
  import { parseEther, formatEther } from 'viem'
  import { PUBLIC_SERVER, PUBLIC_WALLETKIT_ID, PUBLIC_CLIENT, PUBLIC_CONTRACT_ADDRESS } from '$env/static/public'
  import { onMount } from 'svelte';

  const paymentsABI = [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "sender",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "string",
          name: "invoice",
          type: "string",
        },
      ],
      name: "PaymentReceived",
      type: "event",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "_invoice",
          type: "string",
        },
      ],
      name: "makePayment",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    }
  ]

  let account = $state(null)

  const networks = [avalanche, avalancheFuji]

  const config = createConfig({
    chains: networks,
    transports: {
      [avalanche.id]: http(),
      [avalancheFuji.id]: http(),
    },
  })

  // 2. Set up Wagmi adapter
  const wagmiAdapter = new WagmiAdapter({
    projectId: PUBLIC_WALLETKIT_ID,
    networks: [avalanche, avalancheFuji]
  })

  // console.log(PUBLIC_WALLETKIT_ID, wagmiAdapter)

  // 3. Configure the metadata
  const metadata = {
    name: 'Elela',
    description: 'Anonymity at your fingertips',
    url: 'https://elela.online', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/179229932']
  }

  // 3. Create the modal
  const modal = createAppKit({
    adapters: [wagmiAdapter],
    networks: [avalanche, avalancheFuji],
    metadata,
    projectId: PUBLIC_WALLETKIT_ID,
    features: {
      analytics: true,
      socials: false,
      email: false
    }
  })

  modal.subscribeAccount(acc => {
    console.log(acc.status)
    if(acc.isConnected){
      console.log(`We're connected at: ${acc.address}`, acc.isConnected)
      account = acc.address
    }
    if(!acc.isConnected){
      account = null
    }
  })

  const unwatch = watchAccount(config, {
    onChange(data) {
      console.log('Account changed!', data)
    },
  })

  $effect(() => { console.log(account, getAccount(config).address, typeof account === 'string') }) 


  async function buy(){
    if(account){
      const data = await writeContract(config, {
        address: PUBLIC_CONTRACT_ADDRESS,
        abi: paymentsABI,
        functionName: 'makePayment',
        account: account,
        args: ['tileo1o1o1o'],
        value: parseEther('0.0007')
      })
      console.log("Paid : ", data, account)
    }
  }

  // const data = writeContract(config, {
  //   address: PUBLIC_CONTRACT_ADDRESS,
  //   abi: paymentsABI,
  //   functionName: 'makePayment',
  //   account: getAccount(config).address,
  //   args: ['tileo1o1o1o'],
  //   value: parseEther('0.0007')
  // })

  // 4. Trigger modal programaticaly
  // const openConnectModalBtn = document.getElementById('open-connect-modal')
  // const openNetworkModalBtn = document.getElementById('open-network-modal')

  // openConnectModalBtn.addEventListener('click', () => modal.open())
  // openNetworkModalBtn.addEventListener('click', () => modal.open({ view: 'Networks' }))

</script>

<button onclick={() => { modal.open({ view: 'Connect', namespace: 'eip155' }) }} id="open-connect-modal" class="btn">Connect</button>
<button onclick={() => { modal.open({ view: 'Account' }) }} id="open-connect-modal" class="btn">Account</button>
{#if typeof account === 'string'}
  <button onclick={buy} class="btn btn-neutral">Pay</button>
{/if}