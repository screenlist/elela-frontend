export default function size(bytes) {
  if(bytes < 1024){
    return `${bytes} B`
  }
  if(bytes > 1024 && bytes < 1024**2){
    return `${(Math.round((bytes / (1024)) * 100) / 100).toFixed(2)} KB`
  }
  if(bytes > 1024**2 && bytes < 1024**3){
    return `${(Math.round((bytes / (1024 ** 2)) * 100) / 100).toFixed(2)} MB`
  }
  if(bytes > 1024**3 && bytes < 1024**4){
    return `${(Math.round((bytes / (1024 ** 3)) * 100) / 100).toFixed(2)} GB`
  }
  if(bytes > 1024**4){
    return `${(Math.round((bytes / (1024)) * 100) / 100).toFixed(2)} TB`
  }
}