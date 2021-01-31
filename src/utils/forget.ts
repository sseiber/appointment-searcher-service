export function forget(fireAndForgetAsyncFunc: any, ...params: any[]) {
    (async () => {
        await fireAndForgetAsyncFunc(...params);
    })().catch();
}
