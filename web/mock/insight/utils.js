export const delay = (res, json, time = 1000) => {
    setTimeout(() => {
        res.send(json);
    }, time)
}