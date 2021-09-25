package alerting

import (
	"encoding/json"
	"fmt"
	"infini.sh/framework/core/conditions"
	"infini.sh/framework/core/util"
	"src/github.com/elastic/go-ucfg/yaml"
	"testing"
)


func TestParseYamlConfig(t *testing.T){
	yamlStr := `range:
  ctx.results.hits.hits.[0]._source.number.test.gt: 3`
	config, err := yaml.NewConfig([]byte(yamlStr))
	if err != nil {
		t.Fatal(err)
	}
	var boolConfig = &conditions.Config{}
	err = config.Unpack(boolConfig)
	if err != nil {
		t.Fatal(err)
	}
	fmt.Println(boolConfig.Range)

	cond, err := conditions.NewCondition(boolConfig)
	if err != nil {
		t.Fatal(err)
	}
	searchResStr := `{
    "_shards": {
        "failed": 0,
        "skipped": 0,
        "successful": 1,
        "total": 1
    },
    "hits": {
        "hits": [{"_source":{"number.test": 5, "normal": 7, "number": {"value": 5}}}],
        "max_score": null,
        "total": {
            "relation": "eq",
            "value": 5
        }
    },
    "timed_out": false,
    "took": 0
}`
	searchResults := util.MapStr{}
	err = json.Unmarshal([]byte(searchResStr), &searchResults)
	if err != nil {
		t.Fatal(err)
	}
	fields := util.MapStr{
		"ctx": util.MapStr{
			"results": searchResults,
			"test": util.MapStr{
				"number": 2,
			},
		},
	}
	//searchEvent := &event.Event{
	//	Fields: fields,
	//}
	fieldsBytes, _ := json.Marshal(fields)
	tevent := &MonitorEvent{
		Fields: fieldsBytes,
	}
	//fmt.Println(cond.Check(searchEvent))
	fmt.Println(cond.Check(tevent))
}



