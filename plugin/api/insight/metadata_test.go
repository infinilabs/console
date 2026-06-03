package insight

import (
	"testing"

	"github.com/Knetic/govaluate"
)

func TestRenderFormulaTemplateAvoidsScientificNotation(t *testing.T) {
	formula, err := renderFormulaTemplate("a/{{.bucket_size_in_second}}", map[string]interface{}{
		"bucket_size_in_second": 3.1536e+06,
	})
	if err != nil {
		t.Fatalf("unexpected render error: %v", err)
	}

	if formula != "a/3153600" {
		t.Fatalf("expected non-scientific formula, got %q", formula)
	}

	if _, err := govaluate.NewEvaluableExpression(formula); err != nil {
		t.Fatalf("expected rendered formula to be parseable, got %v", err)
	}
}
