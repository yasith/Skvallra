from django import forms
from skvallra.models import SkvallraUser, Action

from Project.settings import MIN_PARTICIPANTS as global_min_participants

class ActionCreationForm(forms.ModelForm): 

    def __init__(self, *args, **kwargs):
        self.as_super = super(ActionCreationForm, self)
        self.as_super.__init__(*args, **kwargs)   

    class Meta:
        model = Action
        fields = ['description', 'start_date', 'end_date', 'public', 'tags', 'min_participants', 'max_participants' ]

    def save(self, commit=True):
        action = self.as_super.save(commit=False)
        if commit:
            action.save()
        return action

    def clean(self):
        cleaned_data = self.as_super.clean()
        print(cleaned_data)
        start_date = self.cleaned_data.get('start_date')
        end_date = self.cleaned_data.get('end_date')
        min_participants = self.cleaned_data.get('min_participants')
        max_participants = self.cleaned_data.get('max_participants')
        
        if (start_date is not None) and (end_date is not None) and (start_date >= end_date):
            raise forms.ValidationError('End date must be later than start date.')

        if min_participants > max_participants:
            raise forms.ValidationError('Minimum number of participants must be less or equal to \
                                            maximum number of participants.')
        if min_participants > global_min_participants:
            raise forms.ValidationError('Minimum number of participants must be greater or equal to ' +
                                             str(global_min_participants) + '.')

