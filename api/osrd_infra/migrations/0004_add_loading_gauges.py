# Generated by Django 4.0.2 on 2022-04-27 14:55

from django.db import migrations, models
import osrd_infra.schemas.infra
import osrd_infra.utils


class Migration(migrations.Migration):

    dependencies = [
        ('osrd_infra', '0003_tracklinklayer'),
    ]

    operations = [
        migrations.AddField(
            model_name='rollingstock',
            name='loading_gauge',
            field=models.CharField(choices=[(osrd_infra.schemas.infra.LoadingGaugeType['G1'], osrd_infra.schemas.infra.LoadingGaugeType['G1']), (osrd_infra.schemas.infra.LoadingGaugeType['G2'], osrd_infra.schemas.infra.LoadingGaugeType['G2']), (osrd_infra.schemas.infra.LoadingGaugeType['GA'], osrd_infra.schemas.infra.LoadingGaugeType['GA']), (osrd_infra.schemas.infra.LoadingGaugeType['GB'], osrd_infra.schemas.infra.LoadingGaugeType['GB']), (osrd_infra.schemas.infra.LoadingGaugeType['GB1'], osrd_infra.schemas.infra.LoadingGaugeType['GB1']), (osrd_infra.schemas.infra.LoadingGaugeType['GC'], osrd_infra.schemas.infra.LoadingGaugeType['GC']), (osrd_infra.schemas.infra.LoadingGaugeType['FR3_3'], osrd_infra.schemas.infra.LoadingGaugeType['FR3_3'])], default=[], max_length=16),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='infra',
            name='railjson_version',
            field=models.CharField(default='2.2.2', editable=False, max_length=16),
        ),
        migrations.AlterField(
            model_name='tracksectionmodel',
            name='data',
            field=models.JSONField(validators=[osrd_infra.utils.JSONSchemaValidator(limit_value={'definitions': {'ApplicableDirections': {'description': 'An enumeration.', 'enum': ['START_TO_STOP', 'STOP_TO_START', 'BOTH'], 'title': 'ApplicableDirections', 'type': 'string'}, 'ApplicableTrainType': {'description': 'An enumeration.', 'enum': ['FREIGHT', 'PASSENGER'], 'title': 'ApplicableTrainType', 'type': 'string'}, 'Curve': {'properties': {'begin': {'title': 'Begin', 'type': 'number'}, 'end': {'title': 'End', 'type': 'number'}, 'radius': {'title': 'Radius', 'type': 'number'}}, 'required': ['radius', 'begin', 'end'], 'title': 'Curve', 'type': 'object'}, 'LineString': {'description': 'LineString Model', 'properties': {'coordinates': {'items': {'anyOf': [{'items': [{'anyOf': [{'type': 'number'}, {'type': 'integer'}]}, {'anyOf': [{'type': 'number'}, {'type': 'integer'}]}], 'maxItems': 2, 'minItems': 2, 'type': 'array'}, {'items': [{'anyOf': [{'type': 'number'}, {'type': 'integer'}]}, {'anyOf': [{'type': 'number'}, {'type': 'integer'}]}, {'anyOf': [{'type': 'number'}, {'type': 'integer'}]}], 'maxItems': 3, 'minItems': 3, 'type': 'array'}]}, 'minItems': 2, 'title': 'Coordinates', 'type': 'array'}, 'type': {'const': 'LineString', 'title': 'Type', 'type': 'string'}}, 'required': ['coordinates'], 'title': 'LineString', 'type': 'object'}, 'LoadingGaugeLimit': {'properties': {'applicable_train_type': {'$ref': '#/definitions/ApplicableTrainType'}, 'begin': {'title': 'Begin', 'type': 'number'}, 'category': {'$ref': '#/definitions/LoadingGaugeType'}, 'end': {'title': 'End', 'type': 'number'}}, 'required': ['category', 'begin', 'end', 'applicable_train_type'], 'title': 'LoadingGaugeLimit', 'type': 'object'}, 'LoadingGaugeType': {'description': 'An enumeration.', 'enum': ['G1', 'G2', 'GA', 'GB', 'GB1', 'GC', 'FR3.3'], 'title': 'LoadingGaugeType', 'type': 'string'}, 'Slope': {'properties': {'begin': {'title': 'Begin', 'type': 'number'}, 'end': {'title': 'End', 'type': 'number'}, 'gradient': {'title': 'Gradient', 'type': 'number'}}, 'required': ['gradient', 'begin', 'end'], 'title': 'Slope', 'type': 'object'}}, 'properties': {'curves': {'items': {'$ref': '#/definitions/Curve'}, 'title': 'Curves', 'type': 'array'}, 'geo': {'$ref': '#/definitions/LineString'}, 'id': {'maxLength': 255, 'title': 'Id', 'type': 'string'}, 'length': {'title': 'Length', 'type': 'number'}, 'line_code': {'title': 'Line Code', 'type': 'integer'}, 'line_name': {'maxLength': 255, 'title': 'Line Name', 'type': 'string'}, 'loading_gauge_limits': {'items': {'$ref': '#/definitions/LoadingGaugeLimit'}, 'title': 'Loading Gauge Limits', 'type': 'array'}, 'navigability': {'$ref': '#/definitions/ApplicableDirections'}, 'sch': {'$ref': '#/definitions/LineString'}, 'slopes': {'items': {'$ref': '#/definitions/Slope'}, 'title': 'Slopes', 'type': 'array'}, 'track_name': {'maxLength': 255, 'title': 'Track Name', 'type': 'string'}, 'track_number': {'title': 'Track Number', 'type': 'integer'}}, 'required': ['geo', 'sch', 'id', 'length', 'line_code', 'line_name', 'track_number', 'track_name', 'navigability', 'slopes', 'curves'], 'title': 'TrackSection', 'type': 'object'})]),
        ),
    ]
