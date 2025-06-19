import wordlist from '$lib/wordlist.json'

export function diceware(){
  const words = wordlist
  const set = []

  while(set.length < 6){
    const charset = '123456'
    let dice = ''
    const randomValues = crypto.getRandomValues(new Uint8Array(6))
    for(let i = 0; i < 5; i++){
      dice += charset[randomValues[i]% charset.length] 
    }
    set.push(dice)
  }

  const phrase = set.map(value => {
    return words[value]
  })
  return phrase.join(' ')
}