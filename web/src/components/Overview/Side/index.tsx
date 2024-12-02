import Sorter from "@/components/infini/search/sort/sort";
import { getSearchFacets } from "@/lib/elasticsearch/search";
import request from "@/utils/request";
import { useEffect, useState } from "react";
import SearchFacet from "./SearchFacet";
import './index.scss';

interface IProps {
    sorterOptions: { label: string; key: string}[]
    sorterValues: string[]
    onSorterChange: (sort: any) => void;
    facetLabels: {[key: string]: string};
    aggsConfig: {
        action: string;
        params: { field: string, params: {[key: string]: any} } []
    }
    filters: {[key: string]: string};
    onFacetChange: (facet: any) => void;
}

interface IFacet {
    field: string;
    data: any;
}

export default (props: IProps) => {

    const { 
        sorterOptions, 
        sorterValues, 
        onSorterChange, 
        facetLabels, 
        aggsConfig : { action, params }, 
        filters, 
        onFacetChange 
    } = props;

    const [facets, setFacets] = useState<IFacet[]>([]);

    const fetchFilterAggs = async () => {
        const res = await request(action, {
            method: "POST",
            body: {
                size: 0,
                aggs: params,
            },
        }) as { [key: string]: any };
        if (res?.aggregations) {
            const fts = getSearchFacets(res, Object.keys(facetLabels));
            if (fts.length > 0) {
                setFacets(fts);
            }
        }
    };

    useEffect(() => {
        fetchFilterAggs()
    }, [])

    return (
        <div className="search-filter">
            <div style={{ marginBottom: 10 }}>
                <Sorter
                    options={sorterOptions}
                    value={sorterValues}
                    onChange={onSorterChange}
                />
            </div>
            <div className="facet-cnt">
                {facets.map((ft) => {
                    return (
                        <SearchFacet
                            key={ft.field}
                            label={facetLabels[ft.field]}
                            field={ft.field}
                            data={ft.data}
                            onChange={onFacetChange}
                            selectedKeys={filters[ft.field] || []}
                        />
                    )
                })}
            </div>
        </div>
    )
}