import HowThisWorks from '@/components/marketing/HowThisWorks';
import CampaignActivePanel from '@/components/marketing/controls/CampaignActivePanel';
import ProjectRotationPanel from '@/components/marketing/controls/ProjectRotationPanel';

// One screen to switch everything the weekly auto-generator looks at on or off.
export default function AutomationControls() {
  return (
    <div>
      <HowThisWorks
        steps={[
          'Switch on the campaigns you want promoted this week — the generator fills their coming 7 days.',
          'Switch on the portfolio projects you want kept in the background rotation.',
          'Anything switched off is skipped entirely until you turn it back on.',
        ]}
        note="Everything the generator creates lands as Pending Review on your calendar, so nothing posts without your approval."
      />
      <div className="space-y-5">
        <CampaignActivePanel />
        <ProjectRotationPanel />
      </div>
    </div>
  );
}