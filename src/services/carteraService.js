// cartera.service.js

/**
 * Aplica los filtros activos al conjunto de datos.
 */
export const applyFilters = (dataSet, activeFilters) => {
    if (!Array.isArray(dataSet)) return [];
    if (!activeFilters || activeFilters.length === 0) return dataSet;

    return dataSet.filter(item => 
        activeFilters.every(([key, values]) => {
            const llaveFiltro = key.toLowerCase();

            // 1. Lógica especial para Novedades
            if (llaveFiltro === 'cantidad_novedades' || llaveFiltro === 'novedades' || llaveFiltro === 'tipo_novedad') {
                const cantNovedades = item['Cantidad_Novedades'] !== undefined ? item['Cantidad_Novedades'] : item['cantidad_novedades'];
                const tipoNovedad = item['Tipo_Novedad'] !== undefined ? item['Tipo_Novedad'] : item['tipo_novedad'];

                if (cantNovedades === undefined && tipoNovedad === undefined) {
                    return true; 
                }

                const quiereConNovedad = values.some(v => String(v).toLowerCase().includes('con') || parseInt(v) > 0);
                const quiereSinNovedad = values.some(v => String(v).toLowerCase().includes('sin') || String(v) === '0' || parseInt(v) === 0);

                let filaTieneNovedad = false;
                if (cantNovedades !== undefined && cantNovedades !== null) {
                    filaTieneNovedad = parseInt(cantNovedades) > 0;
                } else if (tipoNovedad !== undefined && tipoNovedad !== null) {
                    filaTieneNovedad = String(tipoNovedad).trim().toUpperCase() !== 'SIN NOVEDAD';
                }

                if (quiereConNovedad && filaTieneNovedad) return true;
                if (quiereSinNovedad && !filaTieneNovedad) return true;
                
                return false;
            }

            // 2. Lógica para el resto de los filtros
            const valorReal = item[key] !== undefined ? item[key] : item[llaveFiltro];
            if (valorReal === undefined || valorReal === null || valorReal === '') {
                return true; 
            }

            const valorFila = String(valorReal).trim().toLowerCase();
            return values.some(val => String(val).trim().toLowerCase() === valorFila);
        })
    );
};

/**
 * Procesa los datos para los gráficos de barras apiladas.
 */
export const processGeneric = (list, activeFilters, xKey, stackKey, valKey, sortByXAxis = false) => {
    const dataToFilter = Array.isArray(list) ? list : (list?.grouped || []);
    const filtered = applyFilters(dataToFilter, activeFilters);
    
    if (filtered.length === 0) return { data: [], keys: [] };

    const map = new Map();
    const keyTotals = new Map();
    
    for (const d of filtered) {
        const xVal = d[xKey] || 'N/A';
        const sKey = String(d[stackKey] || 'OTROS').toUpperCase().replace(/\s+/g, ' ').trim();
        let val = Number(d[valKey] !== undefined ? d[valKey] : (d['count'] !== undefined ? d['count'] : 1)) || 0;
        
        if (!map.has(xVal)) map.set(xVal, { name: xVal });
        const current = map.get(xVal);
        current[sKey] = (current[sKey] || 0) + val;
        keyTotals.set(sKey, (keyTotals.get(sKey) || 0) + val);
    }

    const sortedKeys = Array.from(keyTotals.entries()).sort((a, b) => b[1] - a[1]).map(entry => entry[0]);
    const dataArray = Array.from(map.values());
    
    dataArray.forEach(d => {
        d.total = sortedKeys.reduce((acc, k) => acc + (Number(d[k]) || 0), 0);
    });
    
    if (sortByXAxis) {
        dataArray.sort((a, b) => {
            if (a.name === 'N/A') return 1; 
            if (b.name === 'N/A') return -1;
            return String(a.name).localeCompare(String(b.name), undefined, { numeric: true });
        });
    } else {
        dataArray.sort((a, b) => b.total - a.total);
    }

    return { data: dataArray, keys: sortedKeys };
};

/**
 * Procesa los datos para el gráfico interactivo Sunburst.
 */
export const buildSunburstData = (list, activeFilters, level1Key, level2Key, valKey) => {
    const filtered = applyFilters(list || [], activeFilters);
    if (filtered.length === 0) return { level1: [], level2: [] };

    const rootMap = new Map();
    let globalTotal = 0; 

    for (const d of filtered) {
        const l1Raw = String(d[level1Key] || 'OTROS').toUpperCase().trim();
        let l1 = l1Raw;
        if (l1Raw.includes('EXPIRADA')) l1 = 'VIGENCIA EXPIRADA';
        else if (l1Raw.includes('VIGENT')) l1 = 'VIGENTES';
        else if (l1Raw.includes('ANTICIPA')) l1 = 'ANTICIPADO';

        const l2 = String(d[level2Key] || 'N/A').trim();
        let val = Number(d[valKey] !== undefined ? d[valKey] : 1) || 0;
        globalTotal += val;

        if (!rootMap.has(l1)) rootMap.set(l1, { name: l1, value: 0, children: new Map() });
        const l1Node = rootMap.get(l1);
        l1Node.value += val;
        
        let displayL2 = l2;
        if (l1 === 'VIGENCIA EXPIRADA' || l1 === 'ANTICIPADO') {
            displayL2 = l2 && l2 !== 'N/A' ? l2 : '100%';
        }
        l1Node.children.set(displayL2, (l1Node.children.get(displayL2) || 0) + val);
    }

    const level1 = [];
    const rawLevel2 = [];

    for (const [_, node] of rootMap) {
        let visualTotalForParent = 0;
        const childrenOfNode = [];

        for (const [childName, childValue] of node.children.entries()) {
            let visualSize = childValue;
            if (childValue > 0) {
                const minSize = globalTotal * 0.035; 
                visualSize = Math.max(childValue, minSize);
            }
            visualTotalForParent += visualSize;

            childrenOfNode.push({
                name: childName, value: childValue, visualValue: visualSize, 
                parentName: node.name, parentValue: node.value, globalTotal
            });
        }

        childrenOfNode.sort((a, b) => b.value - a.value);
        rawLevel2.push(...childrenOfNode);

        level1.push({ 
            name: node.name, value: node.value, visualValue: visualTotalForParent, globalTotal 
        });
    }
    
    level1.sort((a, b) => b.value - a.value);
    
    const finalLevel2 = [];
    for (const l1Node of level1) {
        const childrenMatchingParent = rawLevel2.filter(child => child.parentName === l1Node.name);
        finalLevel2.push(...childrenMatchingParent);
    }
    
    return { level1, level2: finalLevel2 };
};