import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateLeadEnquiryDto } from '../leads/dto/create-lead-enquiry.dto';
import { AddFavoriteDto } from '../me/dto/favorite.dto';
import { UpdateAccountSettingsDto } from '../me/dto/update-account-settings.dto';
import { UpdateTenantStatusDto } from '../admin/dto/update-tenant-status.dto';
import { AdminUpdateUserDto, AdminUserFilterDto } from '../admin/dto/admin-user.dto';

async function errorsFor<T extends object>(cls: new () => T, plain: Record<string, unknown>) {
  const instance = plainToInstance(cls, plain);
  const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });
  return { instance, failing: errors.map((e) => e.property) };
}

describe('request DTO rules introduced by the local QA pass', () => {
  it('lead enquiry: fieldsToShare is limited to name, phone and email (QA-LOCAL-11)', async () => {
    const base = { intent: 'ENQUIRY', preferredContact: 'PHONE', consentTextVersion: 'buyer-lead-disclosure-en-AE-v1' };
    expect((await errorsFor(CreateLeadEnquiryDto, { ...base, fieldsToShare: ['name', 'phone'] })).failing).toEqual([]);
    expect((await errorsFor(CreateLeadEnquiryDto, { ...base, fieldsToShare: ['name', 'passport'] })).failing).toEqual(['fieldsToShare']);
    expect((await errorsFor(CreateLeadEnquiryDto, { ...base, fieldsToShare: ['name', 'name'] })).failing).toEqual(['fieldsToShare']);
    expect((await errorsFor(CreateLeadEnquiryDto, { ...base, fieldsToShare: [] })).failing).toEqual(['fieldsToShare']);
  });

  it('favourite: listingId must be UUID-shaped (QA-LOCAL-03)', async () => {
    expect((await errorsFor(AddFavoriteDto, { listingId: '11111111-1111-1111-1111-cccc00000001' })).failing).toEqual([]);
    expect((await errorsFor(AddFavoriteDto, { listingId: 'abc' })).failing).toEqual(['listingId']);
  });

  it('account settings: escrowIban is normalised and must look like an IBAN (QA-LOCAL-05)', async () => {
    const ok = await errorsFor(UpdateAccountSettingsDto, { escrowIban: 'ae02 0300 0019 2838 4810 992' });
    expect(ok.failing).toEqual([]);
    expect(ok.instance.escrowIban).toBe('AE020300001928384810992');
    expect((await errorsFor(UpdateAccountSettingsDto, { escrowIban: 'NOT-AN-IBAN' })).failing).toEqual(['escrowIban']);
    expect((await errorsFor(UpdateAccountSettingsDto, { garageVisibility: false })).failing).toEqual([]);
  });

  it('tenant status: a reason is mandatory to suspend or close (QA-LOCAL-10)', async () => {
    expect((await errorsFor(UpdateTenantStatusDto, { status: 'SUSPENDED' })).failing).toEqual(['reason']);
    expect((await errorsFor(UpdateTenantStatusDto, { status: 'SUSPENDED', reason: 'QA' })).failing).toEqual(['reason']);
    expect((await errorsFor(UpdateTenantStatusDto, { status: 'SUSPENDED', reason: 'Repeated mileage misrepresentation' })).failing).toEqual([]);
    expect((await errorsFor(UpdateTenantStatusDto, { status: 'ACTIVE' })).failing).toEqual([]);
  });

  it('admin user update: a reason is mandatory to suspend, disable or demote (QA-LOCAL-10)', async () => {
    expect((await errorsFor(AdminUpdateUserDto, { status: 'SUSPENDED' })).failing).toEqual(['reason']);
    expect((await errorsFor(AdminUpdateUserDto, { isPlatformAdmin: false })).failing).toEqual(['reason']);
    expect((await errorsFor(AdminUpdateUserDto, { isPlatformAdmin: false, reason: 'Role review 2026-10' })).failing).toEqual([]);
    expect((await errorsFor(AdminUpdateUserDto, { displayName: 'Renamed' })).failing).toEqual([]);
  });

  it('admin user filter: role must be a known role key (QA-LOCAL-12)', async () => {
    expect((await errorsFor(AdminUserFilterDto, { role: 'SALES_AGENT' })).failing).toEqual([]);
    expect((await errorsFor(AdminUserFilterDto, { role: 'BUYER' })).failing).toEqual([]);
    expect((await errorsFor(AdminUserFilterDto, { role: 'CEO' })).failing).toEqual(['role']);
  });
});
