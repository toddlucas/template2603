import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '$/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$/components/ui/card';
import { Input } from '$/components/ui/input';
import { Label } from '$/components/ui/label';
import { Textarea } from '$/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$/components/ui/select';
import {
  useOrganizationStore,
  selectCurrentItem,
  selectIsLoadingDetails,
  selectDetailsError
} from '../store';

interface OrganizationFormData {
  name: string;
  code?: string;
  parentOrgId?: number;
  status: string;
  metadata?: string;
}

const OrganizationForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const organization = useOrganizationStore(selectCurrentItem);
  const isLoading = useOrganizationStore(selectIsLoadingDetails);
  const error = useOrganizationStore(selectDetailsError);
  const fetchDetails = useOrganizationStore(state => state.fetchItemDetails);
  const createOrg = useOrganizationStore(state => state.createItem);
  const updateOrg = useOrganizationStore(state => state.updateItem);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<OrganizationFormData>({
    defaultValues: {
      name: '',
      code: '',
      parentOrgId: undefined,
      status: 'active',
      metadata: ''
    }
  });

  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      fetchDetails(parseInt(id, 10));
    }
  }, [isEdit, id, fetchDetails]);

  useEffect(() => {
    if (isEdit && organization) {
      setValue('name', organization.name);
      setValue('code', organization.code || '');
      setValue('parentOrgId', organization.parentOrgId || undefined);
      setValue('status', organization.status || 'active');
      setValue('metadata', organization.metadata || '');
    }
  }, [isEdit, organization, setValue]);

  const onSubmit = async (data: OrganizationFormData) => {
    setIsSubmittingForm(true);

    try {
      if (isEdit && organization) {
        await updateOrg({
          ...organization,
          ...data
        });
      } else {
        await createOrg(data);
      }

      navigate('/organization');
    } catch (error) {
      console.error('Failed to save organization:', error);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">Loading organization...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isEdit && error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-destructive">Error loading organization</h3>
                <div className="mt-2 text-sm text-destructive">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" asChild>
                  <button onClick={() => navigate('/organization')}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">
                    {isEdit ? 'Edit Organization' : 'New Organization'}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isEdit ? 'Update organization details' : 'Create a new organization'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>
              {isEdit ? 'Update the organization information below.' : 'Fill in the organization information below.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name *</Label>
                  <Input
                    id="name"
                    {...register('name', { required: 'Organization name is required' })}
                    placeholder="Enter organization name"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Organization Code</Label>
                  <Input
                    id="code"
                    {...register('code')}
                    placeholder="Enter organization code"
                  />
                  {errors.code && (
                    <p className="text-sm text-destructive">{errors.code.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={watch('status')}
                    onValueChange={(value) => setValue('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-destructive">{errors.status.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentOrgId">Parent Organization ID</Label>
                  <Input
                    id="parentOrgId"
                    type="number"
                    {...register('parentOrgId', { valueAsNumber: true })}
                    placeholder="Enter parent organization ID"
                  />
                  {errors.parentOrgId && (
                    <p className="text-sm text-destructive">{errors.parentOrgId.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metadata">Description</Label>
                <Textarea
                  id="metadata"
                  {...register('metadata')}
                  placeholder="Enter organization description"
                  rows={4}
                />
                {errors.metadata && (
                  <p className="text-sm text-destructive">{errors.metadata.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/organization')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isSubmittingForm}
                >
                  {isSubmitting || isSubmittingForm ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isEdit ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    isEdit ? 'Update Organization' : 'Create Organization'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrganizationForm;
