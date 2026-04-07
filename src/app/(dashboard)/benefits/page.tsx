'use client';

import { store } from '@/lib/store';
import { useBenefits } from '@/hooks/use-data';
import type { Benefit, BenefitStatus, BenefitType } from '@/types';
import { BENEFIT_TYPES } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ExternalLink, CheckCircle2, Clock, XCircle, AlertCircle, Search, Building2, Landmark, Heart, Briefcase } from 'lucide-react';

const statusConfig: Record<BenefitStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle2 }> = {
  available: { label: 'Available', variant: 'outline', icon: AlertCircle },
  applied: { label: 'Applied', variant: 'secondary', icon: Clock },
  active: { label: 'Active', variant: 'default', icon: CheckCircle2 },
  expired: { label: 'Expired', variant: 'destructive', icon: XCircle },
  denied: { label: 'Denied', variant: 'destructive', icon: XCircle },
};

const typeIcons: Record<BenefitType, typeof Shield> = {
  fmla: Briefcase,
  eap: Heart,
  state_program: Landmark,
  federal_program: Landmark,
  employer: Building2,
  nonprofit: Heart,
};

export default function BenefitsPage() {
  const { benefits, loading, updateStatus } = useBenefits();
  const profile = store.getProfile();

  const activeBenefits = benefits.filter(b => b.status === 'active');
  const availableBenefits = benefits.filter(b => b.status === 'available');

  async function handleStatusChange(id: string, status: BenefitStatus) {
    await updateStatus(id, status);
  }

  function BenefitCard({ benefit }: { benefit: Benefit }) {
    const config = statusConfig[benefit.status];
    const StatusIcon = config.icon;
    const TypeIcon = typeIcons[benefit.type];

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <TypeIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{benefit.benefit_name}</CardTitle>
                <CardDescription className="mt-1">{benefit.provider}</CardDescription>
              </div>
            </div>
            <Badge variant={config.variant} className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{benefit.description}</p>

          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground mb-2">Eligibility Requirements</p>
            <ul className="space-y-1">
              {benefit.eligibility_criteria.map((criteria, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                  {criteria}
                </li>
              ))}
            </ul>
          </div>

          {benefit.state && (
            <Badge variant="secondary" className="text-xs">State: {benefit.state}</Badge>
          )}

          <Separator />

          <div className="flex items-center gap-2">
            {benefit.status === 'available' && (
              <>
                <Button size="sm" onClick={() => handleStatusChange(benefit.id, 'applied')}>
                  Mark as Applied
                </Button>
                {benefit.application_url && (
                  <ButtonLink size="sm" variant="outline" href={benefit.application_url} target="_blank" rel="noopener noreferrer">
                    Apply <ExternalLink className="ml-1 h-3 w-3" />
                  </ButtonLink>
                )}
              </>
            )}
            {benefit.status === 'applied' && (
              <>
                <Button size="sm" onClick={() => handleStatusChange(benefit.id, 'active')}>
                  Mark as Active
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleStatusChange(benefit.id, 'denied')}>
                  Denied
                </Button>
              </>
            )}
            {benefit.status === 'active' && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange(benefit.id, 'expired')}>
                Mark Expired
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Benefits & Programs</h1>
          <p className="text-muted-foreground">Find and track caregiver support programs you&apos;re eligible for</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading benefits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Benefits & Programs</h1>
        <p className="text-muted-foreground">Find and track caregiver support programs you&apos;re eligible for</p>
      </div>

      {/* FMLA Eligibility Quick Check */}
      <Alert className="border-primary/20 bg-primary/5">
        <Shield className="h-4 w-4 text-primary" />
        <AlertDescription className="ml-2">
          <span className="font-medium">FMLA Eligibility Check:</span> Based on your profile ({profile.employment_status.replace('_', ' ')} in {profile.state}),
          you may be eligible for up to 12 weeks of job-protected leave under FMLA, plus {profile.state === 'CA' ? '8 weeks of paid leave through California PFL' : 'additional state programs'}.
        </AlertDescription>
      </Alert>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Benefits</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBenefits.length}</div>
            <p className="text-xs text-muted-foreground">currently enrolled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Programs</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableBenefits.length}</div>
            <p className="text-xs text-muted-foreground">you may qualify for</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{benefits.length}</div>
            <p className="text-xs text-muted-foreground">in our database</p>
          </CardContent>
        </Card>
      </div>

      {/* Benefits by Category */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Programs</TabsTrigger>
          <TabsTrigger value="federal">Federal</TabsTrigger>
          <TabsTrigger value="state">State</TabsTrigger>
          <TabsTrigger value="employer">Employer</TabsTrigger>
          <TabsTrigger value="nonprofit">Nonprofit</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {benefits.map(b => <BenefitCard key={b.id} benefit={b} />)}
          </div>
        </TabsContent>

        <TabsContent value="federal" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {benefits.filter(b => b.type === 'fmla' || b.type === 'federal_program').map(b => <BenefitCard key={b.id} benefit={b} />)}
          </div>
        </TabsContent>

        <TabsContent value="state" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {benefits.filter(b => b.type === 'state_program').map(b => <BenefitCard key={b.id} benefit={b} />)}
          </div>
        </TabsContent>

        <TabsContent value="employer" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {benefits.filter(b => b.type === 'employer' || b.type === 'eap').map(b => <BenefitCard key={b.id} benefit={b} />)}
          </div>
        </TabsContent>

        <TabsContent value="nonprofit" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {benefits.filter(b => b.type === 'nonprofit').map(b => <BenefitCard key={b.id} benefit={b} />)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
