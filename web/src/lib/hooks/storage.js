import { useCallback, useState, useEffect } from "react"

export function useLocalStorage(key, defaultValue, encryptor) {
  return useStorage(key, defaultValue, window.localStorage, encryptor)
}

export function useSessionStorage(key, defaultValue) {
  return useStorage(key, defaultValue, window.sessionStorage)
}

function useStorage(key, defaultValue, storageObject, encryptor) {
  const [value, setValue] = useState(() => {
    const storeValue = storageObject.getItem(key)
    if (storeValue) {
      if(encryptor && typeof encryptor.encode == 'function') return encryptor.decode(storeValue);
      return storeValue
    }

    if (typeof defaultValue === "function") {
      return defaultValue()
    } else {
      return defaultValue
    }
  })

  useEffect(() => {
    if (value === undefined) return storageObject.removeItem(key)
    let toStoreValue = value;
    if(encryptor && typeof encryptor.encode == 'function'){
      toStoreValue = encryptor.encode(toStoreValue)
    }
    storageObject.setItem(key, toStoreValue)
  }, [key, value, storageObject])

  const remove = useCallback(() => {
    setValue(undefined)
  }, [])

  return [value, setValue, remove]
}