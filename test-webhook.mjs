async function test() {
    try {
        const res = await fetch("https://hooks.koratflow.agency/webhook/get-superadmin-data");
        const data = await res.json();
        console.log("Is array?", Array.isArray(data));
        console.log("Keys if object:", Object.keys(data));
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error(err);
    }
}
test();
