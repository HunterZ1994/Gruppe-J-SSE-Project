function createPasswordHash(value) {
    let res = value;
    for (let i = 0; i < 1000, i++;) {
        res = crypto.createHash('sha256').update(res).digest('hex');
    }
    return res;
}

console.log(createPasswordHash('amazon'));
console.log(createPasswordHash('wiener'));