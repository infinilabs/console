package alerting

import (
	"reflect"
	"strings"
	"testing"

	modelalerting "infini.sh/console/model/alerting"
	"infini.sh/framework/core/util"
)

func TestValidateChannelBeforeEnableRequiresEmailConfig(t *testing.T) {
	channel := &modelalerting.Channel{
		Name:    "Email Channel",
		Type:    modelalerting.ChannelEmail,
		SubType: modelalerting.ChannelEmail,
	}

	err := validateChannelBeforeEnable(channel)
	if err == nil {
		t.Fatal("expected incomplete email channel to be rejected")
	}
	if !strings.Contains(err.Error(), "smtp server and recipients") {
		t.Fatalf("expected combined config hint, got %v", err)
	}
}

func TestValidateChannelBeforeEnableRequiresRecipients(t *testing.T) {
	channel := &modelalerting.Channel{
		Name:    "Email Channel",
		Type:    modelalerting.ChannelEmail,
		SubType: modelalerting.ChannelEmail,
		Email: &modelalerting.Email{
			ServerID: "smtp-1",
		},
	}

	err := validateChannelBeforeEnable(channel)
	if err == nil {
		t.Fatal("expected missing recipients to be rejected")
	}
	if !strings.Contains(err.Error(), "at least one recipient") {
		t.Fatalf("expected recipient hint, got %v", err)
	}
}

func TestValidateChannelBeforeEnableAcceptsCompleteEmailChannel(t *testing.T) {
	channel := &modelalerting.Channel{
		Name:    "Email Channel",
		Type:    modelalerting.ChannelEmail,
		SubType: modelalerting.ChannelEmail,
		Email: &modelalerting.Email{
			ServerID: "smtp-1",
		},
	}
	channel.Email.Recipients.To = []string{"ops@example.com"}

	if err := validateChannelBeforeEnable(channel); err != nil {
		t.Fatalf("expected complete email channel to pass validation, got %v", err)
	}
}

func TestBuildChannelSortUsesStableChannelOrderByDefault(t *testing.T) {
	got := buildChannelSort("")
	want := []util.MapStr{
		{"sub_type": util.MapStr{"order": "asc"}},
		{"type": util.MapStr{"order": "asc"}},
		{"name": util.MapStr{"order": "asc"}},
		{"updated": util.MapStr{"order": "desc"}},
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("expected stable default sort %#v, got %#v", want, got)
	}
}

func TestBuildChannelSortKeepsRequestedFieldAndStableFallback(t *testing.T) {
	got := buildChannelSort("updated:asc")
	want := []util.MapStr{
		{"updated": util.MapStr{"order": "asc"}},
		{"sub_type": util.MapStr{"order": "asc"}},
		{"type": util.MapStr{"order": "asc"}},
		{"name": util.MapStr{"order": "asc"}},
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("expected requested sort with stable fallback %#v, got %#v", want, got)
	}
}
