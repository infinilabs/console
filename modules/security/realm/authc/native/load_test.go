package native

import (
	"fmt"
	"strings"
	"testing"

	"github.com/segmentio/encoding/json"
)

func TestPermissionFileHasNoDuplicateMethodPathPairs(t *testing.T) {
	apis := map[string]ElasticsearchAPIMetadataList{}
	if err := json.Unmarshal(permissionFile, &apis); err != nil {
		t.Fatalf("failed to unmarshal permission file: %v", err)
	}

	seen := map[string]string{}
	for category, list := range apis {
		for _, md := range list {
			owner := fmt.Sprintf("%s/%s", category, md.Name)
			for _, method := range md.Methods {
				key := strings.ToUpper(method) + " " + md.Path
				if previous, ok := seen[key]; ok {
					t.Fatalf("duplicate permission route %s in %s and %s", key, previous, owner)
				}
				seen[key] = owner
			}
		}
	}
}
