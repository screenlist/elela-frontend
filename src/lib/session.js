let warningTimeout;
let logoutTimeout;

export function setupSessionTimers(expiryTime, { onWarning, onExpiry }) {
  clearSessionTimers()

  const now = new Date()
  const expiry = new Date(expiryTime)
  const msUntilWarning = expiry - now - 1000 * 60 * 1
  const msUntilLogout = expiry - now
  
  if (msUntilWarning > 0) {
    warningTimeout = setTimeout(onWarning, msUntilWarning)
  }

  if (msUntilLogout > 0) {
    logoutTimeout = setTimeout(onExpiry, msUntilLogout)
  }
}

export function clearSessionTimers(){
  clearTimeout(warningTimeout)
  clearTimeout(logoutTimeout)
}