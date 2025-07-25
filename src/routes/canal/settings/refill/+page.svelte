<script>
  import { Info, ArrowUpDown, FolderClosed, Phone, CreditCard, DollarSign, Droplet } from '@lucide/svelte'
  import { PUBLIC_SERVER, PUBLIC_WALLETKIT_ID, PUBLIC_CLIENT } from '$env/static/public'

  let { data } = $props()
  
  // Fiat
  let email = $state('')
  let quantity = $state(10)
  let loadingPricing = $state(false)
  let pricingData = $state({
    price_usd: '0.00',
    price_zar: '0.00',
    price_avax: '0.0000',
    calls: {
      minutes: 0
    },
    storage: {
      storage: 0,
      downloads: 0
    }
  })
  let pricingError = $state(false)

  async function getPricing(quantity) {
    loadingPricing = true
    pricingError = false
    const res = await fetch(`${PUBLIC_SERVER}/payments/price?quantity=${quantity}`)
    if(res.ok){
      pricingData = await res.json()
      loadingPricing = false
    } else {
      pricingError = true
      loadingPricing = false
    }
  }

  $effect(async () => {
    if(quantity){
      await getPricing(quantity)
    }
  })

  let fiatModal

  function openFiatModal(){ fiatModal.showModal() }

  function closeFiatModal(){ fiatModal.close() }
</script>

<section class="card bg-base-200 min-h-[70vh] w-full">
  <div class="card-body">
    <h2 class="card-title">Refill</h2>
    {#if !data.canal.is_premium }
      <div role="alert" class="alert alert-warning alert-soft">
        <Info />
        <span>This feature is for premium canals, <a class="link" href="/generate/buy">get yours</a>.</span>
      </div>
    {:else}
      <div role="alert" class="alert alert-soft alert-info">
        <Info />
        <span>For crypto currency we accept Avalanche & for fiat currency we accept South African rand.</span>
      </div>
    {/if}
    <fieldset class="fieldset">
      <input id="drops" name="quantity" type="range" min="10" max="1000" bind:value={quantity} class="range w-full" />
    </fieldset>
    <section class="card card-border card-xs items-center w-full">
      <div class="card-body max-w-lg">
        {#if loadingPricing}
          <div class="flex justify-center items-center h-24.5 w-full">
            <span class="loading loading-spinner text-neutral"></span>
          </div>
        {:else}
          <div class="stats stats-horizontal shadow">
            <div class="stat">
              <div class="stat-figure text-neutral" >
                <Droplet />
              </div>
              <div class="stat-title">Drops</div>
              <div class="stat-value">{quantity}</div>
            </div>
          
            <div class="stat">
              <div class="stat-figure text-neutral" >
                <DollarSign/>
              </div>
              <div class="stat-title">Cost</div>
              <div class="stat-value">{pricingData.price_usd}</div>
            </div>
          </div>
        {/if}
      </div>
    </section>
    <div class="card-actions flex-col mt-4 sm:flex-row">
      <button onclick={openFiatModal} class="btn btn-neutral items-center w-full sm:w-fit sm:flex-1">{pricingData.price_zar} <CreditCard /></button>
      <div class="divider sm:divider-vertical">OR</div>
      <a href={`/generate/buy/crypto?quantity=${quantity}&conduit=${data.canal.usage.id}`} class="btn btn-neutral items-center w-full sm:w-fit sm:flex-1">
        {pricingData.price_avax} AVAX
        <svg width="25" height="25" viewBox="0 0 2501 2501" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="1250.5" cy="1250.5" r="954.5" fill="white"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M2500.51 1250.51C2500.51 1940.86 1940.86 2500.51 1250.51 2500.51C560.152 2500.51 0.507812 1940.86 0.507812 1250.51C0.507812 560.154 560.152 0.509766 1250.51 0.509766C1940.86 0.509766 2500.51 560.154 2500.51 1250.51ZM1630.92 1245.23C1653.37 1206.35 1709.5 1206.35 1731.96 1245.23L1971.68 1660.45C1994.13 1699.34 1966.07 1747.95 1921.16 1747.95H1441.71C1396.81 1747.95 1368.74 1699.34 1391.2 1660.45L1630.92 1245.23ZM1501.32 845.734C1523.65 884.41 1523.65 932.059 1501.32 970.735L1088.69 1685.44C1066.36 1724.12 1025.09 1747.94 980.435 1747.94H579.875C534.97 1747.94 506.905 1699.33 529.357 1660.44L1200.01 498.84C1222.46 459.952 1278.59 459.952 1301.04 498.84L1501.32 845.734Z" fill="#FF394A"/>
        </svg>
      </a>
    </div>
  </div>
</section>
<dialog bind:this={fiatModal} class="modal modal-bottom sm:modal-middle">
  <div class="modal-box bg-secondary text-base-100">
    <h3 class="text-xl font-bold mb-2">Pay {pricingData.price_zar}</h3>
    <div role="alert" class="alert alert-info">
      <Info />
      <span>Our payment processor requires your email but if you are uncomfortable with this, pay with crypto instead.</span>
    </div>
    <fieldset class="fieldset mt-4 rounded-box border p-4">
      <label for="email" class="label">Email</label>
      <input id="email" type="email" class="input bg-neutral text-base-100" bind:value={email} placeholder="cutename@email.com" />
    </fieldset>
    <div class="modal-action min-w-1/2">
      <button onclick={closeFiatModal} class="btn btn-outline flex-1">Cancel</button>
      <a onclick={closeFiatModal} href={`/generate/buy/fiat?quantity=${quantity}&email=${email}&conduit=${data.canal.usage.id}`} class="btn btn-neutral flex-1">Pay</a>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>Close</button>
  </form>
</dialog>