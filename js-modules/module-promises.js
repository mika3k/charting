

/**
 * Callback called after dynamic script loading.
 *
 * @callback loadScriptCallback
 * @param {?Error} err - error if loading problems.
 * @param {?HTMLScriptElement} script - script element if successfully loaded.
 * @return {void} 
 */
/**
 * Appends external script to html.head and loads it.
 *
 * @param {string} src - address of script.
 * @param {loadScriptCallback} callback - called after script has been loaded.
 */
function loadScript(src, callback) {
  // create <script> tag
  let script = document.createElement('script')
  // set tag attributes
  script.src = src
  script.async = true  // (default) causes scritp loading/execution async
  // script.async = false // causes scritp loading/execution defer
  script.onload = callback(null, script)
  script.onerror = callback(new Error(`Script loading from ${src} failed.`))
  // attach element to page in head
  document.head.append(script)
  return ;
}





function experimentLoadingLodash() {
  loadScript(
    'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/3.2.0/lodash.js',
    (err, script) => {
      if(err){
        console.log('Something went wrong: ', err)
      }
      else {
        console.log('Underscore function from lodash: ', _)
      }
    }
  )
}

class MyPromiseError extends Error {
  constructor(message) {
    super(message)
  }
}

let immediatePromise = new Promise((resolve, reject) => {
  // finishes here:
  resolve("Successfully finished.")

  // ignored
  reject(new MyPromiseError('Rejecting after resolve/reject have no effect.'))
  // ignored
  resolve("Resolving after resolve/reject have no effect.")
})

let timerPromise = (timeout = 1000) => new Promise(
  (resolve, reject) => setTimeout(
    () => resolve('done.')
    , timeout
  )
)

timerPromise(1000)
  .finally(() => console.log('In any case, timer promise finished.'))
  .then(
    result => console.log('Successfully resolved timer promise with result: ', result),
    err    => console.log('Timer promise rejected, description: ', err)
  )

timerPromise(1000).then(
  null, // not intrested with successful result.
  err    => console.log('Timer promise rejected, description: ', err)
)

timerPromise(1000).catch(
  reason => console.log('Timer promise rejected, description: ', err)
)


function promisedLoadScript(src) {
  return new Promise(function (resolve, reject) {
    let script = document.createElement('script')
    script.src = src
    script.type='text/javascript'
    script.defer = true
    // script.async = true  // (default) causes scritp loading/execution async
    // script.async = false // causes scritp loading/execution defer
    script.onload = () => resolve(script)
    script.onerror = () => reject(new Error(`Script loading from ${src} failed.`))
    document.head.append(script)
    
  })
}

let chainedResult = promisedLoadScript('./script-to-load-1.js')
  .then(script => promisedLoadScript('./script-to-load-2.js'))
  .then(script => promisedLoadScript('./script-to-load-3.js'))
  .then(script => {
    console.log(window.script1Test)
    const result = window.script1Test() + '\n' 
      + window.script2Test() + '\n' 
      + window.script3Test() + '\n'
    console.log(result)
  })



// let chainedScopedResult = 
//   promisedLoadScript('./script-to-load-1.js').then(script1 => { 
//     promisedLoadScript('./script-to-load-2.js').then(script2 => { 
//       promisedLoadScript('./script-to-load-3.js').then(script3 => 
//         script1Test() + '\n' + script2Test() + '\n' + script3Test() + '\n'
//       )
//     })
//   })

// console.log(chainedScopedResult)


// *****************************************
// Fetching with promises
// *****************************************

async function fetchColorsJson() {
  let response = await fetch(
    './colors.json',
    {
      method: 'GET',
      mode:   'cors',
      cache:  'no-cache',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow',
      referrerPolicy: 'no-referrer'
    }
  )
  if(!response.ok) {
    throw new Error()
  }
  else {
    return await response.json()
  }
}

function displayColors() {
  fetchColorsJson()
    .then(colors => console.log('Fetched colors: ', colors))
    .catch(err => console.log('Fetching colors faild because: ', err))
}

export function displayColorsInPre() {
  fetchColorsJson()
    .then(colors => {
      let pre = document.createElement('pre')
      pre.innerHTML = JSON.stringify(colors.colors[1], null, "\t")
      window.root.appendChild(pre)
      console.log('Fetched colors: ', colors)
    })
    .catch(err => console.log('Fetching colors faild because: ', err))
}