<script>
  import { createAppKit } from '@reown/appkit'
  import { avalanche, avalancheFuji } from '@reown/appkit/networks'
  import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
  import { getAccount, createConfig, http, writeContract, watchAccount, getBalance, createStorage, cookieStorage, cookieToInitialState } from "@wagmi/core"
  import { parseEther, formatEther } from 'viem'
  import { PUBLIC_SERVER, PUBLIC_WALLETKIT_ID, PUBLIC_CLIENT, PUBLIC_CONTRACT_ADDRESS, PUBLIC_APP_ENV } from '$env/static/public'
  import { onDestroy, onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { Info } from '@lucide/svelte'
  import { addToast, cleanupToasts, dismissToast } from '$lib/toasts'
  import { toasts } from '$lib/toasts.svelte.js'

  const { data } = $props()

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
  let loading = $state(false)
  let paymentTimer
  let modal
  let unsubscribe
  let isInitialised = false
  
  const activeNetwork = PUBLIC_APP_ENV === 'production' ? avalanche : avalancheFuji

  const wagmiAdapter = new WagmiAdapter({
    projectId: PUBLIC_WALLETKIT_ID,
    networks: [activeNetwork]
  })

  const config = wagmiAdapter.wagmiConfig

  onMount(() => {

    if(isInitialised) return

    initialiseWallet()
    isInitialised = true

    return () => { cleanUp() }
  })

  onDestroy(() => {
    cleanUp()
    cleanupToasts()
  })

  function cleanUp(){
    loading = false
    if(unsubscribe){
      unsubscribe()
      unsubscribe = null
    }
    if(paymentTimer){
      clearTimeout(paymentTimer)
      paymentTimer = null
    }
    if(account){
      modal.disconnect()
    }
  }

  function initialiseWallet(){
    const metadata = {
      name: 'Elela',
      description: 'Anonymity at your fingertips',
      url: 'https://app.elela.online', // origin must match your domain & subdomain
      icons: ['https://app.elela.online/icon-dark.svg']
    }

    modal = createAppKit({
      adapters: [wagmiAdapter],
      networks: [activeNetwork],
      metadata,
      projectId: PUBLIC_WALLETKIT_ID,
      defaultNetwork: activeNetwork,
      enableNetworkSwitch: false,
      debug: true,
      featuredWalletIds: [
        'f323633c1f67055a45aac84e321af6ffe46322da677ffdd32f9bc1e33bafe29c',
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
        '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
        'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa',
        '8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4'
      ],
      features: {
        analytics: true,
        socials: false,
        email: false
      }
    })

    if(unsubscribe){ unsubscribe() }
    unsubscribe = modal.subscribeAccount(handleAccountUpdate)
  }


  function handleAccountUpdate(acc){
    const isCorrectNetwork = typeof acc.caipAddress === 'string' ? acc.caipAddress.split(':').slice(0, 2).join(':') === `eip155:${activeNetwork.id}` : false
    if(acc.isConnected && isCorrectNetwork && acc.address !== 'undefined'){
      account = acc.address 
    } else {
      account = null
    }
  }

  async function buy(){
    if(!account) return 

    loading = true

    try {
      const drum = await writeContract(config, {
        address: PUBLIC_CONTRACT_ADDRESS,
        abi: paymentsABI,
        functionName: 'makePayment',
        account: account,
        args: [data.crypto.reference],
        value: parseEther(data.crypto.price),
        chainId: activeNetwork.id,
        connector: config.connectors[0]
      })

      paymentTimer = setTimeout(() => {
        goto(`/generate/phrase?ref=${data.crypto.reference}&sender=${account}`)
      }, 1000*15)
      
    } catch (error) {
      console.log('Payment error', error)
      addToast({ message: 'Error: could not process your payment', type: 'error', auto: true })
      loading = false
    }
  }
  
  function connect(){
    try {
      modal.open({ view: 'Connect', namespace: 'eip155' })
    } catch (error) {
      addToast({ message: error.message, type: 'error', auto: true })
      console.log('Connect error:', error)
    }
  }

  function disconnect(){
    try {
      modal.disconnect('eip155')
    } catch (error) {
      addToast({ message: error.message, type: 'error', auto: true })
      console.log('Disconnect error:', error)
    }
  }
</script>

<div class="flex flex-col justify-items-start items-center p-4">
  <div class="card card-border bg-accent max-w-lg w-full min-w-xs">
    <section class="card-body">
      <div class="avatar">
        <div class="w-24 rounded-full">
          <img src="/avax.svg" alt="AVAX icon" />
        </div>
      </div>
      <h1 class="card-title">Pay {data.crypto.price} {data.crypto.currency}</h1>

      {#if loading}
        <div role="alert" class="alert alert-soft alert-warning">
          <div class="inline-grid *:[grid-area:1/1]">
            <div class="status status-warning animate-ping"></div>
            <div class="status status-warning"></div>
          </div>
          Processing payment, don't reload the page!
        </div>
      {/if}
      
      <div class="card-actions flex-row">
        {#if typeof account === 'string'}
          <button disabled={loading} onclick={buy} class="btn btn-neutral flex-1">
            {#if loading}
              <span class="loading loading-spinner loading-sm"></span>
            {:else}
              Pay
            {/if}
          </button>
          <button disabled={loading} onclick={disconnect} class="btn btn-outline flex-1">Disconnect</button>
        {:else}
          <button disabled={loading} onclick={connect} class="btn btn-neutral flex-1">Connect</button>
        {/if}
      </div>
    </section>
  </div>
</div>
<div class="toast toast-top toast-center">
  {#each toasts as toast (toast.id) }
    <div class={`alert alert-${toast.type}`}>
      <span>{toast.message}</span>
    </div>
  {/each}
</div>
