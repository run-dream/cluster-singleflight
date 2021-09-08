类似 go 的singleflight, 用于处理 node 多进程的归并回源。

用法:
``` javascript
async function request(url) {
  const singleflight = new Singleflight();
  return singleflight.do("request", async () => {
    return (await got(url)).body;
  });
}
···