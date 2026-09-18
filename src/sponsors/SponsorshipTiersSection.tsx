import { Fragment } from 'react'
import { Eyebrow, Section } from '../components/Layout'
import { Reveal } from '../components/Reveal'
import { BEARCAT_MARK } from '../lib/images'

interface BenefitRow {
  name: string
  silver: boolean
  gold: boolean
  platinum: boolean
}

interface BenefitCategory {
  category: string
  benefits: BenefitRow[]
}

const TIER_CATEGORIES: BenefitCategory[] = [
  {
    category: 'General',
    benefits: [
      { name: 'Introduced at opening talk', silver: true, gold: true, platinum: true },
      { name: 'Access sponsor lounge', silver: true, gold: true, platinum: true },
      { name: 'Get company booth', silver: true, gold: true, platinum: true },
      { name: 'Send engineers and designers', silver: true, gold: true, platinum: true },
      { name: 'Participate in judging', silver: true, gold: true, platinum: true },
      { name: 'Demo company/API at opening', silver: true, gold: true, platinum: true },
      { name: 'Host tech talk during hackathon', silver: false, gold: true, platinum: true },
      { name: 'Host on-campus HackBU event', silver: false, gold: false, platinum: true },
      { name: 'Info session during hackathon', silver: false, gold: false, platinum: true },
    ],
  },
  {
    category: 'Recruiting',
    benefits: [
      { name: 'Distribute recruiting materials', silver: true, gold: true, platinum: true },
      { name: 'Distribute swag', silver: true, gold: true, platinum: true },
      { name: 'Access hacker resumes', silver: true, gold: true, platinum: true },
      { name: 'Send recruiters', silver: false, gold: true, platinum: true },
      { name: 'On-site interview room', silver: false, gold: false, platinum: true },
      { name: 'Send recruiting/API email', silver: false, gold: false, platinum: true },
    ],
  },
  {
    category: 'Branding',
    benefits: [
      { name: 'Logo on website and ads', silver: true, gold: true, platinum: true },
      { name: 'Logo on t-shirts', silver: true, gold: true, platinum: true },
      { name: 'Sponsor\'s prize category', silver: true, gold: true, platinum: true },
      { name: 'Pre-hackathon social media post', silver: false, gold: true, platinum: true },
      { name: 'Company banner on display', silver: false, gold: false, platinum: true },
    ],
  },
]

function TierCheck({ included, tierName }: { included: boolean; tierName: string }) {
  if (included) {
    return (
      <span className="inline-flex items-center justify-center">
        <span
          className="bg-pine text-cloud inline-flex h-6 w-6 items-center justify-center rounded-full"
          aria-hidden="true"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <span className="sr-only">Included in {tierName}</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center justify-center">
      <span className="text-pine/25 select-none text-base font-medium" aria-hidden="true">
        —
      </span>
      <span className="sr-only">Not included in {tierName}</span>
    </span>
  )
}

export function SponsorshipTiersSection() {
  return (
    <Section id="tiers" labelledBy="tiers-title" className="bg-cloud">
      <Reveal>
        <div className="max-w-3xl">
          <Eyebrow>HackBU 2027 • Jan 30 - Jan 31</Eyebrow>
          <h2
            id="tiers-title"
            className="font-display text-display-lg text-pine mt-4 font-semibold text-balance"
          >
            Sponsorship tiers.
          </h2>
          <p className="text-lede text-pine mt-5">
            Choose the package that fits your organization&apos;s recruiting,
            branding, and engagement goals. All tiers directly support student
            hackers at Binghamton University.
          </p>
        </div>
      </Reveal>

      {/* Main Chart Table */}
      <Reveal delay={0.1}>
        <div className="mt-12">
          {/* Header Bar matching image design */}
          <div className="border-frost bg-frost/50 flex items-center justify-between rounded-t-3xl border border-b-0 px-6 py-4 sm:px-8">
            <span className="font-display text-caption text-pine font-semibold tracking-wide">
              HackBU 2027
            </span>
            <div className="flex items-center gap-2">
              <span
                className="brand-mark brand-mark-bearcat bg-pine block h-6"
                style={{ aspectRatio: `${BEARCAT_MARK.width} / ${BEARCAT_MARK.height}` }}
                aria-hidden="true"
              />
            </div>
            <span className="font-display text-caption text-pine font-semibold tracking-wide">
              Jan 30 - Jan 31
            </span>
          </div>

          <div className="border-frost overflow-x-auto rounded-b-3xl border bg-cloud shadow-xs">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead>
                <tr className="border-frost border-b">
                  <th scope="col" className="p-5 sm:p-6 w-[40%] align-bottom">
                    <span className="font-display text-display-md text-pine font-semibold">
                      Sponsorship Tiers
                    </span>
                    <span className="text-caption text-pine/80 mt-1 block">
                      Benefits &amp; opportunities
                    </span>
                  </th>
                  <th
                    scope="col"
                    className="border-frost/60 bg-frost/15 p-5 text-center sm:p-6 w-[20%] border-l align-bottom"
                  >
                    <span className="font-display text-display-sm text-pine font-semibold block">
                      Silver
                    </span>
                    <span className="font-display text-display-md text-pine font-bold block mt-1">
                      $2,000
                    </span>
                  </th>
                  <th
                    scope="col"
                    className="border-frost/60 bg-frost/30 p-5 text-center sm:p-6 w-[20%] border-l align-bottom"
                  >
                    <span className="text-eyebrow text-pine/80 font-medium uppercase tracking-wider block mb-1">
                      Popular
                    </span>
                    <span className="font-display text-display-sm text-pine font-semibold block">
                      Gold
                    </span>
                    <span className="font-display text-display-md text-pine font-bold block mt-1">
                      $3,000
                    </span>
                  </th>
                  <th
                    scope="col"
                    className="border-frost/60 bg-frost/45 p-5 text-center sm:p-6 w-[20%] border-l align-bottom"
                  >
                    <span className="text-eyebrow text-pine/80 font-medium uppercase tracking-wider block mb-1">
                      Complete
                    </span>
                    <span className="font-display text-display-sm text-pine font-semibold block">
                      Platinum
                    </span>
                    <span className="font-display text-display-md text-pine font-bold block mt-1">
                      $4,000
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {TIER_CATEGORIES.map((cat) => (
                  <Fragment key={cat.category}>
                    <tr>
                      <th
                        colSpan={4}
                        scope="colgroup"
                        className="border-frost bg-frost/60 text-eyebrow text-pine border-y px-6 py-3 font-semibold uppercase tracking-wider"
                      >
                        {cat.category}
                      </th>
                    </tr>
                    {cat.benefits.map((benefit) => (
                      <tr
                        key={benefit.name}
                        className="hover:bg-frost/20 transition-colors"
                      >
                        <td className="border-frost/50 px-6 py-3.5 text-sm font-medium text-pine border-b">
                          {benefit.name}
                        </td>
                        <td className="border-frost/50 bg-frost/15 px-4 py-3.5 text-center border-b border-l">
                          <TierCheck included={benefit.silver} tierName="Silver" />
                        </td>
                        <td className="border-frost/50 bg-frost/30 px-4 py-3.5 text-center border-b border-l">
                          <TierCheck included={benefit.gold} tierName="Gold" />
                        </td>
                        <td className="border-frost/50 bg-frost/45 px-4 py-3.5 text-center border-b border-l">
                          <TierCheck included={benefit.platinum} tierName="Platinum" />
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add-ons and custom packages footer bar */}
          <div className="border-frost bg-frost/35 mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-pine text-cloud text-caption font-medium rounded-full px-4 py-1.5 shadow-xs">
                Custom Packages Available
              </span>
              <p className="text-body text-pine/90 text-sm">
                Have specific recruitment goals? We will customize a package to suit you.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-caption text-pine font-medium">
              <span className="border-stone/60 bg-cloud rounded-lg border px-3 py-1.5 shadow-xs">
                Add-On: $500
              </span>
              <span className="border-stone/60 bg-cloud rounded-lg border px-3 py-1.5 shadow-xs">
                Deduct: $200
              </span>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}
