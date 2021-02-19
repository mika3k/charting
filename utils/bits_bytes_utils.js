
function formatBytes(bytes, decimals = 2) {
    // https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    // const i = Math.floor(Math.log10(bytes) / Math.log10(k)); 
    // same result because of division
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    const res = parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    console.log(bytes, "B =", res);
    return res;
}

function reverseString(s){
    return s.split("").reverse().join("");
}

function spaceEvery4CharsInString(s) {
    const sRev = reverseString(s);
    // const sRevSpaced = sRev.replace(/(.{4})/g, '$1 ');
    const sRevSpaced = sRev.replace(/(.{1,4})/g, (match) => match + " ");
    const sSpaced = reverseString(sRevSpaced);
    return sSpaced;
}

function formatHex(integer) {
    // const res = integer.toString(16);
    const res = spaceEvery4CharsInString(integer.toString(16));
    console.log(integer, "=", res, "(hex)");
    return res;
}

function formatOct(integer) {
    // const res = integer.toString(8);
    const res = spaceEvery4CharsInString(integer.toString(8));
    console.log(integer, "=", res, "(oct)");
    return res;
}

function formatBin(integer) {
    // const res = integer.toString(2);
    const res = spaceEvery4CharsInString(integer.toString(2));
    console.log(integer, "=", res, "(bin)");
    return res;
}

function onesComplement(integer) {
    // complement is number which when added to orginal will give something defined
    // integer + one's complement = 0
    // one's complement of n = ~n = -n - 1
	const res = ~integer;
    console.log("One\'s complement of", integer, "=", res);
    return res;
}

function twosComplement(integer) {
    // complement is number which when added to orginal will give something defined
    // integer + two's complement = 2**64
    
    // negate bits and add one:
    // two's complement of n = ~n + 1 = -n
    const res = -integer;
    console.log("Two\'s complement of", integer, "=", res);
    return res;
}

function maxPositiveSigIntOfNBits(N) {
    const res = 2**N/2-1;
    console.log("Max positive integer of", N, "bits signed = ", res);
    return res;
}


formatBytes(0x7fffffff); 
formatHex(0x7fffffff); 
formatOct(0x7fffffff); 
formatBin(0x7fffffff); 

onesComplement(5);
twosComplement(0x7fffffff);

maxPositiveSigIntOfNBits(32);






