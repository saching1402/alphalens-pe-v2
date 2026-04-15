import uuid
from django.db import models


class FundManager(models.Model):
    """103 unique fund managers from Consol View Values sheet"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, unique=True)
    strategy = models.CharField(max_length=20, null=True, blank=True)
    pb_score = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    aum_usd_m = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    year_found = models.SmallIntegerField(null=True, blank=True)
    segment = models.CharField(max_length=200, null=True, blank=True)
    latest_fund_size_usd_m = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'fund_managers'

    def __str__(self):
        return self.name


class Fund(models.Model):
    """444 funds from Fund Manager Info sheet"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fund_id = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    manager = models.ForeignKey(FundManager, on_delete=models.CASCADE, related_name='funds')
    fund_name = models.CharField(max_length=200)
    vintage = models.SmallIntegerField(null=True, blank=True)
    fund_size_usd_m = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    fund_type = models.CharField(max_length=100, null=True, blank=True)
    investments = models.IntegerField(null=True, blank=True)
    total_investments = models.IntegerField(null=True, blank=True)
    irr = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    tvpi = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    rvpi = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    dpi = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    moic = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    fund_quartile = models.CharField(max_length=80, null=True, blank=True)
    irr_benchmark = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    tvpi_benchmark = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    dpi_benchmark = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    as_of_quarter = models.CharField(max_length=10, null=True, blank=True)
    as_of_year = models.SmallIntegerField(null=True, blank=True)
    geography = models.CharField(max_length=500, null=True, blank=True)
    industry = models.CharField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'funds'

    def __str__(self):
        return self.fund_name
