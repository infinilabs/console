package alerting

import (
	"github.com/buger/jsonparser"
	"strconv"
	"strings"
)

type MonitorEvent struct {
	Fields []byte
}

func (ev *MonitorEvent) GetValue(key string) (interface{}, error) {
	keyParts := strings.Split(key, ".")//todo whether ctx field contains dot
	val, valType, _, err := jsonparser.Get(ev.Fields, keyParts...)
	if err != nil {
		return val, err
	}
	switch  valType {
	case jsonparser.String:
		return string(val), nil
	case jsonparser.Number:

		return strconv.Atoi(string(val))
	}
	return nil, nil
}

//func SplitFieldsKey(key, sep string) []string {
//	sr := strings.NewReader(key)
//	if ch, size, sr.ReadRune()
//}

