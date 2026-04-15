from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.dashboard),
    path('managers/', views.managers_list),
    path('managers/<uuid:pk>/', views.manager_detail),
    path('top/', views.top_managers),
    path('scatter/', views.scatter),
    path('quartile/', views.quartile_dist),
    path('import/', views.import_excel),
]
