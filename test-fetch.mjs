fetch('https://n8n.koratflow.agency/webhook/get-superadmin-data')
    .then(res => res.json())
    .then(data => {
        const arr = Array.isArray(data) ? data : data.negocios;
        const neg = arr?.[0] || {};
        console.log(Object.keys(neg));
        console.log('tipo_fidelizacion:', neg.tipo_fidelizacion);
    })
    .catch(err => console.error(err));
