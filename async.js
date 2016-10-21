function runAsync(gen) {
    return new Promise((resolve, reject) => {
        function loop(result) {
            if (result.done) {
                return resolve(result.value);
            }
            
            result.value.then(handleResolved, handleRejected);
        }
        
        function handleResolved(value) {
            let result;
            try {
                result = gen.next(value);
            } catch (ex) {
                reject(ex);
                return;
            }
            loop(result);
        }
        
        function handleRejected(error) {
            let result;
            try {
                result = gen.throw(error);
            } catch (ex) {
                reject(ex);
                return;
            }
            loop(result);
        }
        
        loop(gen.next());
    });
}

function async(f) {
    return function() {
        return runAsync(f.apply(this, arguments));
    };
}