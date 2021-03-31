export {sayHi}
export {sayHi as default}
export {x}

console.log('About this module:')
console.log(import.meta)

let x;
x = x === undefined ? 'Cat' : x + '.Updated'

function sayHi(user) {
  return `gritter.js: ${user} says Hi!`
}