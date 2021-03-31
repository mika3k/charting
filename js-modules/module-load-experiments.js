import {sayHi, x as user} from './gritter.js'
import defaultGritter from './gritter.js'


export default function experiment() {
  
  experimentImport()
  experimentDynamicImport()
  
}

function experimentImport() {

  console.log('Controlling embedded: Hellow.')
  console.log(sayHi('Michal'))
  console.log('Controlling embedded: user: ', user)
  console.log('Controlling embedded: default: ', defaultGritter)
  console.log(defaultGritter(user))

}

function experimentDynamicImport() {

  // dynamic import
  // works also from regular scripts
  import((()=>'./gritter.js')())
    .then(({x: userDyn, default: sayHiDyn}) => {
      console.log('Controlling embedded: user dynamic: ', userDyn)
      console.log('Controlling embedded: default dynamic: ', sayHiDyn)
    }).catch(err => {
      console.log(err)
    })

  

}