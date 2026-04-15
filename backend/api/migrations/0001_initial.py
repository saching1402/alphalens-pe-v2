import uuid
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name='FundManager',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('name', models.CharField(max_length=200, unique=True)),
                ('strategy', models.CharField(blank=True, max_length=20, null=True)),
                ('pb_score', models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True)),
                ('aum_usd_m', models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('year_found', models.SmallIntegerField(blank=True, null=True)),
                ('segment', models.CharField(blank=True, max_length=200, null=True)),
                ('latest_fund_size_usd_m', models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'db_table': 'fund_managers'},
        ),
        migrations.CreateModel(
            name='Fund',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('fund_id', models.CharField(blank=True, db_index=True, max_length=50, null=True)),
                ('manager', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='funds', to='api.fundmanager')),
                ('fund_name', models.CharField(max_length=200)),
                ('vintage', models.SmallIntegerField(blank=True, null=True)),
                ('fund_size_usd_m', models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True)),
                ('fund_type', models.CharField(blank=True, max_length=100, null=True)),
                ('investments', models.IntegerField(blank=True, null=True)),
                ('total_investments', models.IntegerField(blank=True, null=True)),
                ('irr', models.DecimalField(blank=True, decimal_places=3, max_digits=8, null=True)),
                ('tvpi', models.DecimalField(blank=True, decimal_places=4, max_digits=8, null=True)),
                ('rvpi', models.DecimalField(blank=True, decimal_places=4, max_digits=8, null=True)),
                ('dpi', models.DecimalField(blank=True, decimal_places=4, max_digits=8, null=True)),
                ('moic', models.DecimalField(blank=True, decimal_places=4, max_digits=8, null=True)),
                ('fund_quartile', models.CharField(blank=True, max_length=80, null=True)),
                ('irr_benchmark', models.DecimalField(blank=True, decimal_places=3, max_digits=8, null=True)),
                ('tvpi_benchmark', models.DecimalField(blank=True, decimal_places=4, max_digits=8, null=True)),
                ('dpi_benchmark', models.DecimalField(blank=True, decimal_places=4, max_digits=8, null=True)),
                ('as_of_quarter', models.CharField(blank=True, max_length=10, null=True)),
                ('as_of_year', models.SmallIntegerField(blank=True, null=True)),
                ('geography', models.CharField(blank=True, max_length=500, null=True)),
                ('industry', models.CharField(blank=True, max_length=500, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'db_table': 'funds'},
        ),
    ]
